"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Lightbulb, Repeat, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { useMarketing } from "@/components/marketing-journal/marketing-store";
import {
  LEARNING_TYPE, knownServiceTypes, knownTags, resolveChain, campaignChain,
} from "@/components/marketing-journal/marketing-helpers";
import { SectionHead, LearningCard, MigrationNeeded } from "@/components/marketing-journal/marketing-ui";
import { LearningDialog } from "@/components/marketing-journal/learning-dialog";
import { cn } from "@/lib/utils";
import type { MktLearning, LearningType } from "@/lib/db/marketing-repository";

type TypeFilter = "all" | LearningType;

export default function LessonsLibraryPage() {
  const {
    clients, services, campaigns, learnings, loaded, broken, load,
    addLearning, editLearning, removeLearning,
  } = useMarketing();

  const [typeF, setTypeF] = useState<TypeFilter>("all");
  const [clientF, setClientF] = useState("");
  const [serviceF, setServiceF] = useState("");
  const [tagF, setTagF] = useState("");
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editingLearning, setEditingLearning] = useState<MktLearning | undefined>();

  useEffect(() => { if (!loaded) load(); }, [loaded]);

  // Resolve each learning's chain once for filtering + display.
  const rows = useMemo(() => learnings.map((l) => {
    const { campaign, service, client } = resolveChain(l, campaigns, services, clients);
    return { l, campaign, service, client };
  }), [learnings, campaigns, services, clients]);

  const filtered = useMemo(() => rows.filter(({ l, service, client }) => {
    if (typeF !== "all" && l.type !== typeF) return false;
    if (clientF && client?.id !== clientF) return false;
    if (serviceF && service?.type !== serviceF) return false;
    if (tagF && !l.tags.includes(tagF)) return false;
    if (repeatOnly && !l.repeat) return false;
    return true;
  }), [rows, typeF, clientF, serviceF, tagF, repeatOnly]);

  const serviceTypes = useMemo(() => knownServiceTypes(services).filter((t) => services.some((s) => s.type === t)), [services]);
  const tags = useMemo(() => knownTags(learnings).filter((t) => learnings.some((l) => l.tags.includes(t))), [learnings]);
  const tagSuggestions = useMemo(() => knownTags(learnings), [learnings]);
  const campaignOptions = useMemo(() => campaigns.map((c) => {
    const cl = campaignChain(c, services, clients).client;
    return { id: c.id, label: `${cl?.name ?? "—"} · ${c.name}` };
  }), [campaigns, services, clients]);

  const hasFilters = typeF !== "all" || clientF || serviceF || tagF || repeatOnly;
  function clearFilters() { setTypeF("all"); setClientF(""); setServiceF(""); setTagF(""); setRepeatOnly(false); }

  const workedN = filtered.filter((r) => r.l.type === "worked").length;
  const didntN = filtered.filter((r) => r.l.type === "didnt").length;

  const sel = "h-8 bg-[#111] border border-white/15 text-[11px] text-white/80 px-2 rounded-md focus:outline-none";

  return (
    <>
      <Topbar title="Marketing Journal" subtitle="Lessons Library"
        actions={
          <Button onClick={() => { setEditingLearning(undefined); setDialog(true); }} size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] h-8 gap-1.5 transition-colors duration-150">
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Log Learning
          </Button>
        }
      />

      <PageShell className="space-y-6">
        <Link href="/marketing-journal"
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/40 hover:text-[#FFD600] transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Marketing Journal
        </Link>

        <SectionHead index="★" title="Lessons Library"
          meta={`${filtered.length} shown · ${workedN} worked · ${didntN} didn't`} />

        {broken ? (
          <MigrationNeeded />
        ) : (
          <>
            {/* ══ Filters ═══════════════════════════════════ */}
            <div className="flex flex-wrap items-center gap-2">
              {/* worked / didn't segmented */}
              <div className="flex">
                {(["all", "worked", "didnt"] as TypeFilter[]).map((t) => (
                  <button key={t} onClick={() => setTypeF(t)}
                    className={cn("px-3 h-8 text-[10px] font-black uppercase tracking-[0.08em] border transition-colors -ml-px first:ml-0",
                      typeF === t
                        ? "bg-[#FFD600] text-black border-[#FFD600] z-10"
                        : "bg-transparent text-white/45 border-white/12 hover:text-white/80")}
                    style={typeF === t && t !== "all" ? { background: LEARNING_TYPE[t].color, borderColor: LEARNING_TYPE[t].color } : undefined}>
                    {t === "all" ? "All" : LEARNING_TYPE[t].label}
                  </button>
                ))}
              </div>

              <select value={clientF} onChange={(e) => setClientF(e.target.value)} className={sel}>
                <option value="">All clients</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select value={serviceF} onChange={(e) => setServiceF(e.target.value)} className={sel}>
                <option value="">All services</option>
                {serviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <select value={tagF} onChange={(e) => setTagF(e.target.value)} className={sel}>
                <option value="">All tags</option>
                {tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <button onClick={() => setRepeatOnly((v) => !v)}
                className={cn("flex items-center gap-1.5 px-3 h-8 text-[10px] font-black uppercase tracking-[0.08em] border transition-colors",
                  repeatOnly ? "border-[#6BD98A] text-[#6BD98A] bg-[#6BD98A]/10" : "border-white/12 text-white/45 hover:text-white/80")}>
                <Repeat className="w-3 h-3" strokeWidth={3} /> Repeat only
              </button>

              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 px-2 h-8 text-[10px] font-black uppercase tracking-[0.08em] text-white/40 hover:text-[#E60012] transition-colors">
                  <X className="w-3 h-3" strokeWidth={3} /> Clear
                </button>
              )}
            </div>

            {/* ══ List ══════════════════════════════════════ */}
            {!loaded ? (
              <div className="grid gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
            ) : learnings.length === 0 ? (
              <EmptyState icon={<Lightbulb className="w-6 h-6" />} title="No lessons logged yet"
                description="Every campaign learning lands here. Log your first one and start building the playbook."
                action={
                  <Button onClick={() => setDialog(true)} size="sm"
                    className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] gap-1.5">
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Log Learning
                  </Button>
                } />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<Lightbulb className="w-6 h-6" />} title="Nothing matches these filters"
                description="Try clearing a filter to see more lessons." />
            ) : (
              <div className="grid gap-2">
                <AnimatePresence initial={false}>
                  {filtered.map(({ l, campaign, client }) => (
                    <motion.div key={l.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "linear" }}>
                      <LearningCard learning={l}
                        context={client && campaign ? { clientId: client.id, clientName: client.name, campaignName: campaign.name } : undefined}
                        onEdit={() => { setEditingLearning(l); setDialog(true); }}
                        onRemove={async () => { if (confirm("Delete this learning?")) { await removeLearning(l.id); toast.success("Deleted"); } }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </PageShell>

      {dialog && (
        <LearningDialog open campaignOptions={campaignOptions} tagSuggestions={tagSuggestions}
          existing={editingLearning}
          onClose={() => { setDialog(false); setEditingLearning(undefined); }}
          onSave={async (data) => {
            if (editingLearning) { await editLearning(editingLearning.id, data); toast.success("Updated"); }
            else { await addLearning(data); toast.success("Learning logged 💡"); }
          }}
          onDelete={editingLearning ? async () => {
            await removeLearning(editingLearning.id); setDialog(false); setEditingLearning(undefined); toast.success("Deleted");
          } : undefined} />
      )}
    </>
  );
}
