"use client";
import {
  DEFAULT_SERVICE_TYPES, DEFAULT_TAGS,
  type MktClient, type MktService, type MktCampaign, type MktLearning,
  type ClientStatus, type ServiceStatus, type CampaignStatus, type Verdict,
} from "@/lib/db/marketing-repository";

// ─── Palette (reuses the app's yellow / green / red / blue) ───────
export const ACCENT = "#FFD600";

export const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#6BD98A" },
  paused: { label: "Paused", color: "#FFD600" },
  past:   { label: "Past",   color: "#8A8A8A" },
};

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; color: string }> = {
  active:   { label: "Active",   color: "#6BD98A" },
  paused:   { label: "Paused",   color: "#FFD600" },
  finished: { label: "Finished", color: "#8A8A8A" },
};

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; color: string }> = {
  planning: { label: "Planning", color: "#4F9DFF" },
  running:  { label: "Running",  color: "#6BD98A" },
  finished: { label: "Finished", color: "#8A8A8A" },
};

export const VERDICT: Record<Verdict, { label: string; color: string }> = {
  worked: { label: "Worked",       color: "#6BD98A" },
  mixed:  { label: "Mixed",        color: "#FFD600" },
  didnt:  { label: "Didn't work",  color: "#E60012" },
};

export const LEARNING_TYPE = {
  worked: { label: "What worked", color: "#6BD98A" },
  didnt:  { label: "What didn't", color: "#E60012" },
} as const;

// ─── Money — INR, no decimals, graceful on null ───────────────────
export function money(n: number | null | undefined): string | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Compact money for stat counters: ₹1.2L, ₹48k, ₹900. */
export function moneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "₹0";
  const v = Math.round(n);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(v % 10000000 ? 1 : 0) + "Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(v % 100000 ? 1 : 0) + "L";
  if (v >= 1000) return "₹" + (v / 1000).toFixed(v % 1000 ? 1 : 0) + "k";
  return "₹" + v;
}

/** A number for display, or null when missing — never 0/NaN as a stand-in. */
export function num(n: number | null | undefined): string | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return n.toLocaleString("en-IN");
}

/**
 * Cost per lead: use the stored value if present; otherwise derive it from
 * budget ÷ leads when both exist. Returns { value, derived } or null.
 */
export function costPerLead(c: MktCampaign): { value: number; derived: boolean } | null {
  if (c.costPerLead !== null) return { value: c.costPerLead, derived: false };
  if (c.budgetSpent !== null && c.leads !== null && c.leads > 0) {
    return { value: c.budgetSpent / c.leads, derived: true };
  }
  return null;
}

// ─── Derived selectors (data is small; joins run in memory) ───────
export const servicesForClient = (services: MktService[], clientId: string) =>
  services.filter((s) => s.clientId === clientId);

export const activeServicesForClient = (services: MktService[], clientId: string) =>
  services.filter((s) => s.clientId === clientId && s.status === "active");

export const campaignsForService = (campaigns: MktCampaign[], serviceId: string) =>
  campaigns.filter((c) => c.serviceId === serviceId);

export function campaignsForClient(
  services: MktService[], campaigns: MktCampaign[], clientId: string
): MktCampaign[] {
  const ids = new Set(servicesForClient(services, clientId).map((s) => s.id));
  return campaigns
    .filter((c) => ids.has(c.serviceId))
    .sort((a, b) => (b.startDate ?? b.createdAt).localeCompare(a.startDate ?? a.createdAt));
}

export const learningsForCampaign = (learnings: MktLearning[], campaignId: string) =>
  learnings.filter((l) => l.campaignId === campaignId);

/** Spend tracked = sum of every campaign's budgetSpent that has a value. */
export function totalSpend(campaigns: MktCampaign[]): number {
  return campaigns.reduce((n, c) => n + (c.budgetSpent ?? 0), 0);
}

/** Distinct service types seen so far, merged with defaults (for datalists). */
export function knownServiceTypes(services: MktService[]): string[] {
  const set = new Set<string>(DEFAULT_SERVICE_TYPES);
  for (const s of services) if (s.type.trim()) set.add(s.type.trim());
  return [...set];
}

/** Distinct tags seen so far, merged with defaults. */
export function knownTags(learnings: MktLearning[]): string[] {
  const set = new Set<string>(DEFAULT_TAGS);
  for (const l of learnings) for (const t of l.tags) if (t.trim()) set.add(t.trim());
  return [...set].sort();
}

/** For a learning, resolve its campaign → service → client chain. */
export function resolveChain(
  learning: MktLearning,
  campaigns: MktCampaign[],
  services: MktService[],
  clients: MktClient[]
) {
  const campaign = campaigns.find((c) => c.id === learning.campaignId) ?? null;
  const service = campaign ? services.find((s) => s.id === campaign.serviceId) ?? null : null;
  const client = service ? clients.find((c) => c.id === service.clientId) ?? null : null;
  return { campaign, service, client };
}

/** Campaign → its service and client (for detail pages & pickers). */
export function campaignChain(
  campaign: MktCampaign,
  services: MktService[],
  clients: MktClient[]
) {
  const service = services.find((s) => s.id === campaign.serviceId) ?? null;
  const client = service ? clients.find((c) => c.id === service.clientId) ?? null : null;
  return { service, client };
}
