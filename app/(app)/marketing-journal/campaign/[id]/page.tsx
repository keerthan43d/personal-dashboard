"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, Pencil, Trash2, Target, CalendarDays, ThumbsUp, ThumbsDown, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { useMarketing } from "@/components/marketing-journal/marketing-store";
import {
  VERDICT, CAMPAIGN_STATUS, LEARNING_TYPE, money, num, costPerLead,
  learningsForCampaign, campaignChain, knownTags,
} from "@/components/marketing-journal/marketing-helpers";
import { SectionHead, Pill, Metric, LearningCard, IconBtn } from "@/components/marketing-journal/marketing-ui";
import { CampaignDialog } from "@/components/marketing-journal/campaign-dialog";
import { LearningDialog } from "@/components/marketing-journal/learning-dialog";
import { cn } from "@/lib/utils";
import type { MktLearning } from "@/lib/db/marketing-repository";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    clients, services, campaigns, learnings, loaded, load,
    editCampaign, removeCampaign, addLearning, editLearning, removeLearning,
  } = useMarketing();

  const [editing, setEditing] = useState(false);
  const [learningDialog, setLearningDialog] = useState(false);
  const [editingLearning, setEditingLearning] = useState<MktLearning | undefined>();

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  const campaign = campaigns.find((c) => c.id === id);
  const { service, client } = useMemo(
    () => campaign ? campaignChain(campaign, services, clients) : { service: null, client: null },
    [campaign, services, clients]
  );
  const camplearnings = useMemo(() => learningsForCampaign(learnings, id), [learnings, id]);
  const worked = camplearnings.filter((l) => l.type === "worked");
  const didnt = camplearnings.filter((l) => l.type === "didnt");

  const serviceOptions = services.map((s) => {
    const c = clients.find((x) => x.id === s.clientId);
    return { id: s.id, label: `${c?.name ?? "—"} · ${s.type}` };
  });
  const campaignOptions = campaigns.map((c) => {
    const cl = campaignChain(c, services, clients).client;
    return { id: c.id, label: `${cl?.name ?? "—"} · ${c.name}` };
  });

  if (loaded && !campaign) {
    return (
      <>
        <Topbar title="Marketing Journal" />
        <PageShell>
          <Link href="/marketing-journal" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/40 hover:text-[#FFD600]">
            <ChevronLeft className="w-3.5 h-3.5" /> Marketing Journal
          </Link>
          <EmptyState icon={<Rocket className="w-6 h-6" />} title="Campaign not found"
            description="This campaign may have been deleted." />
        </PageShell>
      </>
    );
  }

  async function handleDelete() {
    if (!campaign) return;
    const n = camplearnings.length;
    if (!confirm(`Delete "${campaign.name}"?${n ? `\n\n${n} learning(s) will also be deleted.` : ""}`)) return;
    await removeCampaign(campaign.id);
    toast.success("Campaign deleted");
    router.push(client ? `/marketing-journal/client/${client.id}` : "/marketing-journal");
  }

  const cpl = campaign ? costPerLead(campaign) : null;
  const verdict = campaign?.verdict ? VERDICT[campaign.verdict] : null;

  return (
    <>
      <Topbar title="Marketing Journal" subtitle={campaign?.name} />
      <PageShell className="space-y-8">
        <Link href={client ? `/marketing-journal/client/${client.id}` : "/marketing-journal"}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/40 hover:text-[#FFD600] transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> {client?.name ?? "Back"}
        </Link>

        {!campaign ? (
          <div className="grid gap-3"><div className="h-40 skeleton" /><div className="h-32 skeleton" /></div>
        ) : (
          <>
            {/* ══ Campaign header ═══════════════════════════ */}
            <div className="relative border border-white/10 bg-[#080808] overflow-hidden">
              <div className="h-1 w-full" style={{ background: verdict?.color ?? CAMPAIGN_STATUS[campaign.status].color }} />
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {verdict ? <Pill label={verdict.label} color={verdict.color} solid /> : null}
                      <Pill label={CAMPAIGN_STATUS[campaign.status].label} color={CAMPAIGN_STATUS[campaign.status].color} />
                      {service && client && (
                        <Link href={`/marketing-journal/client/${client.id}`}
                          className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 hover:text-[#FFD600] transition-colors">
                          {client.name} · {service.type}
                        </Link>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.01em] text-white leading-tight mt-2">{campaign.name}</h1>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <IconBtn onClick={() => setEditing(true)} title="Edit campaign"><Pencil className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn onClick={handleDelete} title="Delete campaign" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                  </div>
                </div>

                {campaign.goal && (
                  <div className="mt-4 flex items-start gap-2">
                    <Target className="w-4 h-4 text-[#FFD600] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <p className="text-[13px] text-white/75 leading-relaxed">{campaign.goal}</p>
                  </div>
                )}
                {(campaign.startDate || campaign.endDate) && (
                  <p className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/40">
                    <CalendarDays className="w-3 h-3" />
                    {campaign.startDate ? format(parseISO(campaign.startDate), "MMM d, yyyy") : "—"}
                    {campaign.endDate ? ` → ${format(parseISO(campaign.endDate), "MMM d, yyyy")}` : campaign.status === "running" ? " → ongoing" : ""}
                  </p>
                )}

                {/* Results — only non-empty metrics show */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30 mb-3">Results</p>
                  <MetricsRow>
                    <Metric label="Budget Spent" value={money(campaign.budgetSpent)} accent="#FFD600" />
                    <Metric label="Leads" value={num(campaign.leads)} />
                    <Metric label="Conversions" value={num(campaign.conversions)} accent="#6BD98A" />
                    <Metric label={cpl?.derived ? "Cost / Lead ≈" : "Cost / Lead"} value={cpl ? money(cpl.value) : null} />
                    <Metric label="Reach" value={num(campaign.reach)} />
                    <Metric label="Clicks" value={num(campaign.clicks)} />
                  </MetricsRow>
                </div>
              </div>
            </div>

            {/* ══ Learnings — two columns ═══════════════════ */}
            <section>
              <SectionHead index="01" title="Learnings" meta={`${camplearnings.length} logged`}>
                <button onClick={() => { setEditingLearning(undefined); setLearningDialog(true); }}
                  className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border border-white/12 text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600] transition-colors duration-150">
                  <Plus className="w-3 h-3" strokeWidth={3} /> Log Learning
                </button>
              </SectionHead>

              {camplearnings.length === 0 ? (
                <EmptyState icon={<ThumbsUp className="w-6 h-6" />} title="No learnings yet"
                  description="After this campaign, jot down what worked and what didn't." />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <LearningColumn type="worked" learnings={worked}
                    onEdit={(l) => { setEditingLearning(l); setLearningDialog(true); }}
                    onRemove={async (l) => { if (confirm("Delete this learning?")) { await removeLearning(l.id); toast.success("Deleted"); } }} />
                  <LearningColumn type="didnt" learnings={didnt}
                    onEdit={(l) => { setEditingLearning(l); setLearningDialog(true); }}
                    onRemove={async (l) => { if (confirm("Delete this learning?")) { await removeLearning(l.id); toast.success("Deleted"); } }} />
                </div>
              )}
            </section>
          </>
        )}
      </PageShell>

      {editing && campaign && (
        <CampaignDialog open existing={campaign} serviceOptions={serviceOptions}
          onClose={() => setEditing(false)}
          onSave={async (data) => { await editCampaign(campaign.id, data); toast.success("Campaign updated"); }}
          onDelete={() => { setEditing(false); handleDelete(); }} />
      )}
      {learningDialog && campaign && (
        <LearningDialog open campaignOptions={campaignOptions} tagSuggestions={knownTags(learnings)}
          defaultCampaignId={campaign.id} existing={editingLearning}
          onClose={() => { setLearningDialog(false); setEditingLearning(undefined); }}
          onSave={async (data) => {
            if (editingLearning) { await editLearning(editingLearning.id, data); toast.success("Updated"); }
            else { await addLearning(data); toast.success("Learning logged 💡"); }
          }}
          onDelete={editingLearning ? async () => {
            await removeLearning(editingLearning.id); setLearningDialog(false); setEditingLearning(undefined); toast.success("Deleted");
          } : undefined} />
      )}
    </>
  );
}

function MetricsRow({ children }: { children: React.ReactNode }) {
  // Metric renders null when empty, so grid cells collapse gracefully.
  return <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">{children}</div>;
}

function LearningColumn({ type, learnings, onEdit, onRemove }: {
  type: "worked" | "didnt"; learnings: MktLearning[];
  onEdit: (l: MktLearning) => void; onRemove: (l: MktLearning) => void;
}) {
  const t = LEARNING_TYPE[type];
  const Icon = type === "worked" ? ThumbsUp : ThumbsDown;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b" style={{ borderColor: `${t.color}30` }}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: t.color }} />
        <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: t.color }}>{t.label}</span>
        <span className="text-[9px] font-black tabular-nums text-white/25 font-numeric ml-auto">{learnings.length}</span>
      </div>
      {learnings.length === 0 ? (
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/20 py-3 text-center">Nothing logged</p>
      ) : (
        <div className="grid gap-2">
          <AnimatePresence>
            {learnings.map((l, i) => (
              <motion.div key={l.id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ delay: i * 0.02, duration: 0.16, ease: "linear" }}>
                <LearningCard learning={l} onEdit={() => onEdit(l)} onRemove={() => onRemove(l)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
