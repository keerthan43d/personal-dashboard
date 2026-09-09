"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, Pencil, Trash2, Globe, User, CalendarDays,
  Layers, Rocket, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { useMarketing } from "@/components/marketing-journal/marketing-store";
import {
  CLIENT_STATUS, SERVICE_STATUS, VERDICT, CAMPAIGN_STATUS, money,
  servicesForClient, campaignsForClient, campaignsForService,
  knownServiceTypes,
} from "@/components/marketing-journal/marketing-helpers";
import { SectionHead, Pill, ClientAvatar, IconBtn } from "@/components/marketing-journal/marketing-ui";
import { ClientDialog } from "@/components/marketing-journal/client-dialog";
import { ServiceDialog } from "@/components/marketing-journal/service-dialog";
import { CampaignDialog } from "@/components/marketing-journal/campaign-dialog";
import { cn } from "@/lib/utils";
import type { MktService, MktCampaign } from "@/lib/db/marketing-repository";

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    clients, services, campaigns, learnings, loaded, load,
    editClient, removeClient, addService, editService, removeService,
    addCampaign,
  } = useMarketing();

  const [editing, setEditing] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<MktService | undefined>();
  const [campaignDialog, setCampaignDialog] = useState(false);

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const client = clients.find((c) => c.id === id);
  const clientServices = useMemo(() => servicesForClient(services, id), [services, id]);
  const clientCampaigns = useMemo(() => campaignsForClient(services, campaigns, id), [services, campaigns, id]);

  const serviceOptions = clientServices.map((s) => ({ id: s.id, label: `${s.type}${s.status !== "active" ? ` (${SERVICE_STATUS[s.status].label})` : ""}` }));
  const serviceType = new Map(services.map((s) => [s.id, s.type]));

  if (loaded && !client) {
    return (
      <>
        <Topbar title="Marketing Journal" />
        <PageShell>
          <BackLink />
          <EmptyState icon={<User className="w-6 h-6" />} title="Client not found"
            description="This client may have been deleted." />
        </PageShell>
      </>
    );
  }

  async function handleDeleteClient() {
    if (!client) return;
    const svc = clientServices.length;
    const camp = clientCampaigns.length;
    const campIds = new Set(clientCampaigns.map((c) => c.id));
    const less = learnings.filter((l) => campIds.has(l.campaignId)).length;
    const parts = [
      `${svc} service${svc === 1 ? "" : "s"}`,
      `${camp} campaign${camp === 1 ? "" : "s"}`,
      `${less} learning${less === 1 ? "" : "s"}`,
    ];
    if (!confirm(`Delete "${client.name}"?\n\nThis also permanently deletes:\n• ${parts.join("\n• ")}\n\nThis cannot be undone.`)) return;
    await removeClient(client.id);
    toast.success("Client deleted");
    router.push("/marketing-journal");
  }

  return (
    <>
      <Topbar title="Marketing Journal" subtitle={client?.name} />
      <PageShell className="space-y-8">
        <BackLink />

        {!client ? (
          <div className="grid gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 skeleton" />)}</div>
        ) : (
          <>
            {/* ══ Client header ═════════════════════════════ */}
            <div className="relative border border-white/10 bg-[#080808] overflow-hidden">
              <div className="h-1 w-full" style={{ background: client.color ?? "#FFD600" }} />
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <ClientAvatar client={client} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.01em] text-white leading-none">{client.name}</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 mt-1.5">
                          {[client.industry, client.city].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <IconBtn onClick={() => setEditing(true)} title="Edit client"><Pencil className="w-3.5 h-3.5" /></IconBtn>
                        <IconBtn onClick={handleDeleteClient} title="Delete client" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Pill label={CLIENT_STATUS[client.status].label} color={CLIENT_STATUS[client.status].color} />
                      {client.startedAt && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                          <CalendarDays className="w-2.5 h-2.5" /> Since {format(parseISO(client.startedAt), "MMM yyyy")}
                        </span>
                      )}
                      {client.contact && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                          <User className="w-2.5 h-2.5" /> {client.contact}
                        </span>
                      )}
                      {client.website && (
                        <a href={client.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/40 hover:text-[#FFD600] transition-colors">
                          <Globe className="w-2.5 h-2.5" /> Website
                        </a>
                      )}
                    </div>
                    {client.notes && (
                      <p className="mt-3 text-[12px] text-white/55 leading-relaxed border-l-2 border-white/10 pl-3 whitespace-pre-wrap">{client.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ══ 01 · SERVICES ═════════════════════════════ */}
            <section>
              <SectionHead index="01" title="Services" meta={`${clientServices.length} total`}>
                <button onClick={() => { setEditingService(undefined); setServiceDialog(true); }}
                  className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border border-white/12 text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600] transition-colors duration-150">
                  <Plus className="w-3 h-3" strokeWidth={3} /> Add Service
                </button>
              </SectionHead>

              {clientServices.length === 0 ? (
                <EmptyState icon={<Layers className="w-6 h-6" />} title="No services yet"
                  description="Add the first thing you do for this client — Google Ads, a website, SEO…" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clientServices.map((s) => (
                    <ServiceCard key={s.id} service={s} campaignCount={campaignsForService(campaigns, s.id).length}
                      onEdit={() => { setEditingService(s); setServiceDialog(true); }}
                      onRemove={async () => {
                        const camps = campaignsForService(campaigns, s.id).length;
                        if (!confirm(`Delete this ${s.type} service?${camps ? `\n\n${camps} campaign(s) and their learnings will also be deleted.` : ""}`)) return;
                        await removeService(s.id); toast.success("Service deleted");
                      }} />
                  ))}
                </div>
              )}
            </section>

            {/* ══ 02 · CAMPAIGNS ════════════════════════════ */}
            <section>
              <SectionHead index="02" title="Campaigns" meta={`${clientCampaigns.length} total · newest first`}>
                <button onClick={() => setCampaignDialog(true)} disabled={clientServices.length === 0}
                  className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border border-white/12 text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600] transition-colors duration-150 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white/70">
                  <Plus className="w-3 h-3" strokeWidth={3} /> Add Campaign
                </button>
              </SectionHead>

              {clientCampaigns.length === 0 ? (
                <EmptyState icon={<Rocket className="w-6 h-6" />} title="No campaigns yet"
                  description={clientServices.length === 0 ? "Add a service first, then log campaigns under it." : "Log the first campaign for this client."} />
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-0 top-1 bottom-1 w-px bg-white/10" />
                  <div className="grid gap-2">
                    <AnimatePresence>
                      {clientCampaigns.map((c, i) => (
                        <motion.div key={c.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }} transition={{ delay: i * 0.02, duration: 0.18, ease: "linear" }}>
                          <TimelineRow campaign={c} serviceType={serviceType.get(c.serviceId) ?? "—"} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </PageShell>

      {editing && client && (
        <ClientDialog open existing={client} onClose={() => setEditing(false)}
          onSave={async (data) => { await editClient(client.id, data); toast.success("Client updated"); }}
          onDelete={() => { setEditing(false); handleDeleteClient(); }} />
      )}
      {serviceDialog && client && (
        <ServiceDialog open clientId={client.id} existing={editingService}
          serviceTypes={knownServiceTypes(services)}
          onClose={() => { setServiceDialog(false); setEditingService(undefined); }}
          onSave={async (data) => {
            if (editingService) { await editService(editingService.id, data); toast.success("Service updated"); }
            else { await addService(data); toast.success("Service added"); }
          }}
          onDelete={editingService ? async () => {
            await removeService(editingService.id); setServiceDialog(false); setEditingService(undefined); toast.success("Service deleted");
          } : undefined} />
      )}
      {campaignDialog && (
        <CampaignDialog open serviceOptions={serviceOptions}
          onClose={() => setCampaignDialog(false)}
          onSave={async (data) => { await addCampaign(data); toast.success("Campaign added"); }} />
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link href="/marketing-journal"
      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/40 hover:text-[#FFD600] transition-colors">
      <ChevronLeft className="w-3.5 h-3.5" /> All Clients
    </Link>
  );
}

// ═══ Service card ═══════════════════════════════════════════
function ServiceCard({ service, campaignCount, onEdit, onRemove }: {
  service: MktService; campaignCount: number; onEdit: () => void; onRemove: () => void;
}) {
  const st = SERVICE_STATUS[service.status];
  const fee = money(service.fee);
  return (
    <div className="group relative border border-white/10 bg-[#080808] hover:border-white/20 transition-colors duration-150">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[13px] font-black uppercase tracking-[0.02em] text-white truncate">{service.type}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Pill label={st.label} color={st.color} />
              {fee && (
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/45 font-numeric">
                  {fee}{service.feeKind === "monthly" ? "/mo" : service.feeKind === "project" ? " project" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <IconBtn onClick={onEdit} title="Edit"><Pencil className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn onClick={onRemove} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
          </div>
        </div>
        {service.description && (
          <p className="mt-2.5 text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap">{service.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/30 font-numeric">
          <span>{campaignCount} campaign{campaignCount === 1 ? "" : "s"}</span>
          {(service.startDate || service.endDate) && (
            <span>
              {service.startDate ? format(parseISO(service.startDate), "MMM yyyy") : "—"}
              {service.endDate ? ` → ${format(parseISO(service.endDate), "MMM yyyy")}` : " → now"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Campaign timeline row ══════════════════════════════════
function TimelineRow({ campaign, serviceType }: { campaign: MktCampaign; serviceType: string }) {
  const verdict = campaign.verdict ? VERDICT[campaign.verdict] : null;
  const status = CAMPAIGN_STATUS[campaign.status];
  const dot = verdict?.color ?? status.color;
  return (
    <Link href={`/marketing-journal/campaign/${campaign.id}`}
      className="group relative flex items-center gap-3 border border-white/10 bg-[#080808] hover:border-white/25 transition-colors duration-150 p-3.5">
      <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ring-2 ring-[#0a0a0a]" style={{ background: dot }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[13px] font-black uppercase tracking-[0.01em] text-white truncate">{campaign.name}</h3>
          {verdict ? <Pill label={verdict.label} color={verdict.color} /> : <Pill label={status.label} color={status.color} />}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 mt-1 truncate">
          {serviceType}
          {campaign.startDate ? ` · ${format(parseISO(campaign.startDate), "MMM d, yyyy")}` : ""}
          {campaign.endDate ? ` → ${format(parseISO(campaign.endDate), "MMM d")}` : ""}
        </p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[#FFD600] transition-colors flex-shrink-0" />
    </Link>
  );
}
