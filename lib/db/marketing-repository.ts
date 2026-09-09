"use client";
/**
 * Marketing Journal — Supabase-backed store for client marketing work.
 * A four-level tree: client → service → campaign → learning, wired with
 * `on delete cascade` so deleting a client removes its whole subtree.
 *
 * Requires migration 0014_marketing_journal.sql to be applied.
 */
import { v4 as uuid } from "uuid";
import { getSupabase } from "./supabase-client";

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[Marketing] ${ctx}: ${error?.message ?? "unknown error"}`);
}

/** numeric/int columns come back as string|number|null from supabase-js. */
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Enums (kept in sync with the migration's CHECK constraints) ──
export type ClientStatus = "active" | "paused" | "past";
export type ServiceStatus = "active" | "paused" | "finished";
export type CampaignStatus = "planning" | "running" | "finished";
export type Verdict = "worked" | "mixed" | "didnt";
export type LearningType = "worked" | "didnt";
export type FeeKind = "monthly" | "project";

/** Starter suggestions. The `type` column is free text, so new service types
 *  can be added just by typing them — they persist and surface thereafter. */
export const DEFAULT_SERVICE_TYPES = [
  "Google Ads",
  "Meta Ads",
  "Website",
  "Web App",
  "SEO",
  "Influencer Marketing",
  "Content",
  "Email",
  "Other",
] as const;

/** Starter tag suggestions — likewise free text and extensible. */
export const DEFAULT_TAGS = [
  "creative",
  "targeting",
  "landing page",
  "budget",
  "offer",
  "timing",
  "audience",
  "copy",
  "funnel",
] as const;

// ─── Types ────────────────────────────────────────────────────────
export type MktClient = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  color: string | null;
  logoUrl: string | null;
  status: ClientStatus;
  contact: string | null;
  website: string | null;
  startedAt: string | null;
  notes: string | null;
  isSample: boolean;
  createdAt: string;
};
export type MktClientInput = Omit<MktClient, "id" | "isSample" | "createdAt">;

export type MktService = {
  id: string;
  clientId: string;
  type: string;
  status: ServiceStatus;
  startDate: string | null;
  endDate: string | null;
  fee: number | null;
  feeKind: FeeKind | null;
  description: string | null;
  isSample: boolean;
  createdAt: string;
};
export type MktServiceInput = Omit<MktService, "id" | "isSample" | "createdAt">;

export type MktCampaign = {
  id: string;
  serviceId: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: CampaignStatus;
  budgetSpent: number | null;
  leads: number | null;
  conversions: number | null;
  costPerLead: number | null;
  reach: number | null;
  clicks: number | null;
  verdict: Verdict | null;
  isSample: boolean;
  createdAt: string;
};
export type MktCampaignInput = Omit<MktCampaign, "id" | "isSample" | "createdAt">;

export type MktLearning = {
  id: string;
  campaignId: string;
  type: LearningType;
  lesson: string;
  tags: string[];
  repeat: boolean;
  isSample: boolean;
  createdAt: string;
};
export type MktLearningInput = Omit<MktLearning, "id" | "isSample" | "createdAt">;

// ─── Row mappers ──────────────────────────────────────────────────
type ClientRow = {
  id: string; name: string; industry: string | null; city: string | null;
  color: string | null; logo_url: string | null; status: string;
  contact: string | null; website: string | null; started_at: string | null;
  notes: string | null; is_sample: boolean; created_at: string;
};
function fromClient(r: ClientRow): MktClient {
  return {
    id: r.id, name: r.name, industry: r.industry, city: r.city,
    color: r.color, logoUrl: r.logo_url, status: r.status as ClientStatus,
    contact: r.contact, website: r.website, startedAt: r.started_at,
    notes: r.notes, isSample: r.is_sample, createdAt: r.created_at,
  };
}

type ServiceRow = {
  id: string; client_id: string; type: string; status: string;
  start_date: string | null; end_date: string | null; fee: number | string | null;
  fee_kind: string | null; description: string | null; is_sample: boolean; created_at: string;
};
function fromService(r: ServiceRow): MktService {
  return {
    id: r.id, clientId: r.client_id, type: r.type, status: r.status as ServiceStatus,
    startDate: r.start_date, endDate: r.end_date, fee: numOrNull(r.fee),
    feeKind: (r.fee_kind as FeeKind) ?? null, description: r.description,
    isSample: r.is_sample, createdAt: r.created_at,
  };
}

type CampaignRow = {
  id: string; service_id: string; name: string; goal: string | null;
  start_date: string | null; end_date: string | null; status: string;
  budget_spent: number | string | null; leads: number | null; conversions: number | null;
  cost_per_lead: number | string | null; reach: number | null; clicks: number | null;
  verdict: string | null; is_sample: boolean; created_at: string;
};
function fromCampaign(r: CampaignRow): MktCampaign {
  return {
    id: r.id, serviceId: r.service_id, name: r.name, goal: r.goal,
    startDate: r.start_date, endDate: r.end_date, status: r.status as CampaignStatus,
    budgetSpent: numOrNull(r.budget_spent), leads: numOrNull(r.leads),
    conversions: numOrNull(r.conversions), costPerLead: numOrNull(r.cost_per_lead),
    reach: numOrNull(r.reach), clicks: numOrNull(r.clicks),
    verdict: (r.verdict as Verdict) ?? null, isSample: r.is_sample, createdAt: r.created_at,
  };
}

type LearningRow = {
  id: string; campaign_id: string; type: string; lesson: string;
  tags: string[] | null; repeat: boolean; is_sample: boolean; created_at: string;
};
function fromLearning(r: LearningRow): MktLearning {
  return {
    id: r.id, campaignId: r.campaign_id, type: r.type as LearningType,
    lesson: r.lesson, tags: r.tags ?? [], repeat: r.repeat,
    isSample: r.is_sample, createdAt: r.created_at,
  };
}

// ─── Clients ──────────────────────────────────────────────────────
export async function listClients(): Promise<MktClient[]> {
  const { data, error } = await getSupabase()
    .from("mkt_clients").select("*").order("created_at", { ascending: true });
  if (error) fail(error, "listClients");
  return ((data ?? []) as ClientRow[]).map(fromClient);
}

export async function createClient(input: MktClientInput, isSample = false): Promise<MktClient> {
  const row = {
    id: uuid(), name: input.name, industry: input.industry, city: input.city,
    color: input.color, logo_url: input.logoUrl, status: input.status,
    contact: input.contact, website: input.website, started_at: input.startedAt,
    notes: input.notes, is_sample: isSample, created_at: now(),
  };
  const { data, error } = await getSupabase().from("mkt_clients").insert(row).select().single();
  if (error) fail(error, "createClient");
  return fromClient(data as ClientRow);
}

export async function updateClient(id: string, patch: Partial<MktClientInput>): Promise<MktClient> {
  const upd: Record<string, unknown> = {};
  if (patch.name !== undefined) upd.name = patch.name;
  if (patch.industry !== undefined) upd.industry = patch.industry;
  if (patch.city !== undefined) upd.city = patch.city;
  if (patch.color !== undefined) upd.color = patch.color;
  if (patch.logoUrl !== undefined) upd.logo_url = patch.logoUrl;
  if (patch.status !== undefined) upd.status = patch.status;
  if (patch.contact !== undefined) upd.contact = patch.contact;
  if (patch.website !== undefined) upd.website = patch.website;
  if (patch.startedAt !== undefined) upd.started_at = patch.startedAt;
  if (patch.notes !== undefined) upd.notes = patch.notes;
  const { data, error } = await getSupabase().from("mkt_clients").update(upd).eq("id", id).select().single();
  if (error) fail(error, "updateClient");
  return fromClient(data as ClientRow);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await getSupabase().from("mkt_clients").delete().eq("id", id);
  if (error) fail(error, "deleteClient");
}

// ─── Services ─────────────────────────────────────────────────────
export async function listServices(): Promise<MktService[]> {
  const { data, error } = await getSupabase()
    .from("mkt_services").select("*").order("created_at", { ascending: true });
  if (error) fail(error, "listServices");
  return ((data ?? []) as ServiceRow[]).map(fromService);
}

export async function createService(input: MktServiceInput, isSample = false): Promise<MktService> {
  const row = {
    id: uuid(), client_id: input.clientId, type: input.type, status: input.status,
    start_date: input.startDate, end_date: input.endDate, fee: input.fee,
    fee_kind: input.feeKind, description: input.description, is_sample: isSample, created_at: now(),
  };
  const { data, error } = await getSupabase().from("mkt_services").insert(row).select().single();
  if (error) fail(error, "createService");
  return fromService(data as ServiceRow);
}

export async function updateService(id: string, patch: Partial<MktServiceInput>): Promise<MktService> {
  const upd: Record<string, unknown> = {};
  if (patch.type !== undefined) upd.type = patch.type;
  if (patch.status !== undefined) upd.status = patch.status;
  if (patch.startDate !== undefined) upd.start_date = patch.startDate;
  if (patch.endDate !== undefined) upd.end_date = patch.endDate;
  if (patch.fee !== undefined) upd.fee = patch.fee;
  if (patch.feeKind !== undefined) upd.fee_kind = patch.feeKind;
  if (patch.description !== undefined) upd.description = patch.description;
  const { data, error } = await getSupabase().from("mkt_services").update(upd).eq("id", id).select().single();
  if (error) fail(error, "updateService");
  return fromService(data as ServiceRow);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await getSupabase().from("mkt_services").delete().eq("id", id);
  if (error) fail(error, "deleteService");
}

// ─── Campaigns ────────────────────────────────────────────────────
export async function listCampaigns(): Promise<MktCampaign[]> {
  const { data, error } = await getSupabase()
    .from("mkt_campaigns").select("*").order("created_at", { ascending: false });
  if (error) fail(error, "listCampaigns");
  return ((data ?? []) as CampaignRow[]).map(fromCampaign);
}

function campaignRow(input: MktCampaignInput) {
  return {
    service_id: input.serviceId, name: input.name, goal: input.goal,
    start_date: input.startDate, end_date: input.endDate, status: input.status,
    budget_spent: input.budgetSpent, leads: input.leads, conversions: input.conversions,
    cost_per_lead: input.costPerLead, reach: input.reach, clicks: input.clicks,
    verdict: input.verdict,
  };
}

export async function createCampaign(input: MktCampaignInput, isSample = false): Promise<MktCampaign> {
  const row = { id: uuid(), ...campaignRow(input), is_sample: isSample, created_at: now() };
  const { data, error } = await getSupabase().from("mkt_campaigns").insert(row).select().single();
  if (error) fail(error, "createCampaign");
  return fromCampaign(data as CampaignRow);
}

export async function updateCampaign(id: string, patch: Partial<MktCampaignInput>): Promise<MktCampaign> {
  const map: Record<keyof MktCampaignInput, string> = {
    serviceId: "service_id", name: "name", goal: "goal", startDate: "start_date",
    endDate: "end_date", status: "status", budgetSpent: "budget_spent", leads: "leads",
    conversions: "conversions", costPerLead: "cost_per_lead", reach: "reach",
    clicks: "clicks", verdict: "verdict",
  };
  const upd: Record<string, unknown> = {};
  for (const k of Object.keys(patch) as (keyof MktCampaignInput)[]) {
    if (patch[k] !== undefined) upd[map[k]] = patch[k];
  }
  const { data, error } = await getSupabase().from("mkt_campaigns").update(upd).eq("id", id).select().single();
  if (error) fail(error, "updateCampaign");
  return fromCampaign(data as CampaignRow);
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await getSupabase().from("mkt_campaigns").delete().eq("id", id);
  if (error) fail(error, "deleteCampaign");
}

// ─── Learnings ────────────────────────────────────────────────────
export async function listLearnings(): Promise<MktLearning[]> {
  const { data, error } = await getSupabase()
    .from("mkt_learnings").select("*").order("created_at", { ascending: false });
  if (error) fail(error, "listLearnings");
  return ((data ?? []) as LearningRow[]).map(fromLearning);
}

export async function createLearning(input: MktLearningInput, isSample = false): Promise<MktLearning> {
  const row = {
    id: uuid(), campaign_id: input.campaignId, type: input.type, lesson: input.lesson,
    tags: input.tags, repeat: input.repeat, is_sample: isSample, created_at: now(),
  };
  const { data, error } = await getSupabase().from("mkt_learnings").insert(row).select().single();
  if (error) fail(error, "createLearning");
  return fromLearning(data as LearningRow);
}

export async function updateLearning(id: string, patch: Partial<MktLearningInput>): Promise<MktLearning> {
  const upd: Record<string, unknown> = {};
  if (patch.campaignId !== undefined) upd.campaign_id = patch.campaignId;
  if (patch.type !== undefined) upd.type = patch.type;
  if (patch.lesson !== undefined) upd.lesson = patch.lesson;
  if (patch.tags !== undefined) upd.tags = patch.tags;
  if (patch.repeat !== undefined) upd.repeat = patch.repeat;
  const { data, error } = await getSupabase().from("mkt_learnings").update(upd).eq("id", id).select().single();
  if (error) fail(error, "updateLearning");
  return fromLearning(data as LearningRow);
}

export async function deleteLearning(id: string): Promise<void> {
  const { error } = await getSupabase().from("mkt_learnings").delete().eq("id", id);
  if (error) fail(error, "deleteLearning");
}

// ─── Sample data ──────────────────────────────────────────────────
export async function hasSampleData(): Promise<boolean> {
  const { count, error } = await getSupabase()
    .from("mkt_clients").select("id", { count: "exact", head: true }).eq("is_sample", true);
  if (error) fail(error, "hasSampleData");
  return (count ?? 0) > 0;
}

/** Wipe only the seeded demo rows. Cascades handle services/campaigns/learnings. */
export async function wipeSampleData(): Promise<void> {
  const { error } = await getSupabase().from("mkt_clients").delete().eq("is_sample", true);
  if (error) fail(error, "wipeSampleData");
}

/** Seed 3 example clients with services, campaigns and learnings. */
export async function seedSampleData(): Promise<void> {
  // 1 — Dr. Solanki Eye Hospital
  const c1 = await createClient({
    name: "Dr. Solanki Eye Hospital", industry: "Healthcare", city: "Mysore",
    color: "#4F9DFF", logoUrl: null, status: "active",
    contact: "Dr. Solanki", website: "https://drsolankieyehospital.com",
    startedAt: "2026-04-01", notes: "LASIK + cataract focus. Wants qualified leads, not just clicks.",
  }, true);
  const s1 = await createService({
    clientId: c1.id, type: "Google Ads", status: "active",
    startDate: "2026-04-01", endDate: null, fee: 25000, feeKind: "monthly",
    description: "Search + Performance Max for LASIK and cataract enquiries.",
  }, true);
  const cam1 = await createCampaign({
    serviceId: s1.id, name: "LASIK Monsoon Push", goal: "Book LASIK consultations before the festive season",
    startDate: "2026-07-01", endDate: "2026-08-15", status: "finished",
    budgetSpent: 48000, leads: 92, conversions: 18, costPerLead: 521.7, reach: null, clicks: 3400,
    verdict: "worked",
  }, true);
  await createLearning({ campaignId: cam1.id, type: "worked", lesson: "Call-only ads outperformed form fills 3:1 for surgery enquiries.", tags: ["creative", "targeting"], repeat: true }, true);
  await createLearning({ campaignId: cam1.id, type: "didnt", lesson: "Broad match burned budget on 'free eye checkup' searchers who never converted.", tags: ["targeting", "budget"], repeat: false }, true);
  const cam2 = await createCampaign({
    serviceId: s1.id, name: "Cataract Awareness", goal: "Fill cataract camp slots for over-60s",
    startDate: "2026-08-20", endDate: null, status: "running",
    budgetSpent: 12000, leads: 34, conversions: null, costPerLead: null, reach: null, clicks: 900,
    verdict: null,
  }, true);
  await createLearning({ campaignId: cam2.id, type: "worked", lesson: "Kannada-language creatives doubled CTR vs English for this age group.", tags: ["creative", "audience"], repeat: true }, true);

  // 2 — Vaibhav Fitness
  const c2 = await createClient({
    name: "Vaibhav Fitness Studio", industry: "Fitness", city: "Bengaluru",
    color: "#6BD98A", logoUrl: null, status: "active",
    contact: "Vaibhav", website: null, startedAt: "2026-06-10",
    notes: "New studio. Needs footfall + a booking website.",
  }, true);
  const s2 = await createService({
    clientId: c2.id, type: "Meta Ads", status: "active",
    startDate: "2026-06-10", endDate: null, fee: 18000, feeKind: "monthly",
    description: "Lead gen for the 10-day trial offer via Instagram + Facebook.",
  }, true);
  const s2b = await createService({
    clientId: c2.id, type: "Website", status: "finished",
    startDate: "2026-06-15", endDate: "2026-07-20", fee: 40000, feeKind: "project",
    description: "One-page booking site with class schedule + WhatsApp CTA.",
  }, true);
  const cam3 = await createCampaign({
    serviceId: s2.id, name: "10-Day Trial Blitz", goal: "Sign up 50 trial members in month one",
    startDate: "2026-06-12", endDate: "2026-07-12", status: "finished",
    budgetSpent: 22000, leads: 140, conversions: 41, costPerLead: 157.1, reach: 58000, clicks: 2600,
    verdict: "mixed",
  }, true);
  await createLearning({ campaignId: cam3.id, type: "worked", lesson: "Before/after reels as ad creative crushed static images on cost per lead.", tags: ["creative"], repeat: true }, true);
  await createLearning({ campaignId: cam3.id, type: "didnt", lesson: "No follow-up SMS meant half the trial leads ghosted — needs a nurture flow.", tags: ["funnel", "offer"], repeat: false }, true);
  await createCampaign({
    serviceId: s2b.id, name: "Booking Site Launch", goal: "Ship the booking site and route ads to it",
    startDate: "2026-07-01", endDate: "2026-07-20", status: "finished",
    budgetSpent: null, leads: null, conversions: null, costPerLead: null, reach: null, clicks: null,
    verdict: "worked",
  }, true);

  // 3 — Ripin Menswear (past client)
  const c3 = await createClient({
    name: "Ripin Menswear", industry: "Retail / Fashion", city: "Mysore",
    color: "#E60012", logoUrl: null, status: "past",
    contact: "Ripin", website: null, startedAt: "2026-01-05",
    notes: "Handover complete. Kept as a reference for retail learnings.",
  }, true);
  const s3 = await createService({
    clientId: c3.id, type: "Influencer Marketing", status: "finished",
    startDate: "2026-01-10", endDate: "2026-03-30", fee: 60000, feeKind: "project",
    description: "Local fashion micro-influencers for the wedding-season collection.",
  }, true);
  const cam4 = await createCampaign({
    serviceId: s3.id, name: "Wedding Season Collab", goal: "Drive store walk-ins via 8 local influencers",
    startDate: "2026-01-15", endDate: "2026-03-15", status: "finished",
    budgetSpent: 55000, leads: null, conversions: null, costPerLead: null, reach: 210000, clicks: null,
    verdict: "didnt",
  }, true);
  await createLearning({ campaignId: cam4.id, type: "didnt", lesson: "Reach looked great but no coupon code meant walk-ins were impossible to attribute.", tags: ["timing", "offer"], repeat: false }, true);
  await createLearning({ campaignId: cam4.id, type: "worked", lesson: "One nano-influencer (12k followers) drove more DMs than the three big accounts combined.", tags: ["targeting", "creative"], repeat: true }, true);
}
