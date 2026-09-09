"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Megaphone, Users, Rocket, Lightbulb, ArrowUpRight,
  Library, Database, Sparkles, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { useMarketing } from "@/components/marketing-journal/marketing-store";
import {
  CLIENT_STATUS, moneyCompact, activeServicesForClient, servicesForClient,
  campaignsForClient, knownTags, campaignChain,
} from "@/components/marketing-journal/marketing-helpers";
import {
  SectionHead, Pill, ClientAvatar, MigrationNeeded,
} from "@/components/marketing-journal/marketing-ui";
import { ClientDialog } from "@/components/marketing-journal/client-dialog";
import { LearningDialog } from "@/components/marketing-journal/learning-dialog";
import { cn } from "@/lib/utils";
import type { MktClient } from "@/lib/db/marketing-repository";

const HAZARD = "repeating-linear-gradient(45deg, #FFD600 0 10px, #0a0a0a 10px 20px)";

export default function MarketingJournalPage() {
  const {
    clients, services, campaigns, learnings, loaded, broken, load,
    addClient, addLearning, seedSamples, wipeSamples,
  } = useMarketing();

  const [clientDialog, setClientDialog] = useState(false);
  const [learningDialog, setLearningDialog] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "active").length;
    const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
    const spend = campaigns.reduce((n, c) => n + (c.budgetSpent ?? 0), 0);
    return { activeClients, activeCampaigns, lessons: learnings.length, spend };
  }, [clients, campaigns, learnings]);

  const hasSample = clients.some((c) => c.isSample);

  const campaignOptions = useMemo(() =>
    campaigns.map((c) => {
      const { client } = campaignChain(c, services, clients);
      return { id: c.id, label: `${client?.name ?? "—"} · ${c.name}` };
    }), [campaigns, services, clients]);

  const tagSuggestions = useMemo(() => knownTags(learnings), [learnings]);

  async function handleSeed() {
    setSeeding(true);
    try { await seedSamples(); toast.success("Sample data loaded"); }
    catch { toast.error("Couldn't load samples"); }
    finally { setSeeding(false); }
  }

  return (
    <>
      <Topbar
        title="Marketing Journal"
        subtitle={`${stats.activeClients} active · ${clients.length} clients · ${stats.lessons} lessons`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setLearningDialog(true)} size="sm"
              className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] h-8 gap-1.5 transition-colors duration-150">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Log Learning
            </Button>
            <Button onClick={() => setClientDialog(true)} size="sm" variant="ghost"
              className="border border-white/12 text-white/70 hover:text-white hover:border-white/25 font-black uppercase tracking-[0.08em] h-8 gap-1.5">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Client
            </Button>
          </div>
        }
      />

      <PageShell className="space-y-10">
        {/* ══ HERO ══════════════════════════════════════════ */}
        <Hero {...stats} />

        {broken ? (
          <MigrationNeeded />
        ) : (
          <>
            {/* ══ 01 · CLIENTS ══════════════════════════════ */}
            <section>
              <SectionHead index="01" title="Clients" meta={`${clients.length} total`}>
                <Link href="/marketing-journal/lessons"
                  className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border border-white/12 text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600] transition-colors duration-150">
                  <Library className="w-3 h-3" strokeWidth={2.5} /> Lessons Library
                </Link>
              </SectionHead>

              {!loaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 skeleton" />)}
                </div>
              ) : clients.length === 0 ? (
                <EmptyState icon={<Users className="w-6 h-6" />}
                  title="No clients yet"
                  description="Add your first client, or load a few example clients to see how it all fits together."
                  action={
                    <div className="flex gap-2">
                      <Button onClick={() => setClientDialog(true)} size="sm"
                        className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] gap-1.5">
                        <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add Client
                      </Button>
                      <Button onClick={handleSeed} size="sm" variant="ghost" disabled={seeding}
                        className="border border-white/12 text-white/70 hover:text-white hover:border-white/25 font-black uppercase tracking-[0.08em] gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {seeding ? "Loading…" : "Load Sample Data"}
                      </Button>
                    </div>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {clients.map((c, i) => (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.03, duration: 0.2, ease: "linear" }}>
                        <ClientCard
                          client={c}
                          activeServices={activeServicesForClient(services, c.id).length}
                          totalServices={servicesForClient(services, c.id).length}
                          campaignCount={campaignsForClient(services, campaigns, c.id).length}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* ══ Sample data controls ══════════════════════ */}
            {loaded && clients.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4 text-[10px] font-black uppercase tracking-[0.1em]">
                <span className="flex items-center gap-1.5 text-white/30">
                  <Database className="w-3 h-3" />
                  {hasSample ? "Sample data is loaded" : "Your data"}
                </span>
                {hasSample ? (
                  <button onClick={async () => { if (confirm("Remove all sample clients and their data?")) { await wipeSamples(); toast.success("Sample data wiped"); } }}
                    className="flex items-center gap-1.5 text-white/40 hover:text-[#E60012] transition-colors cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Wipe Sample Data
                  </button>
                ) : (
                  <button onClick={handleSeed} disabled={seeding}
                    className="flex items-center gap-1.5 text-white/40 hover:text-[#FFD600] transition-colors cursor-pointer">
                    <Sparkles className="w-3 h-3" /> {seeding ? "Loading…" : "Load Sample Data"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </PageShell>

      {clientDialog && (
        <ClientDialog open onClose={() => setClientDialog(false)}
          onSave={async (data) => { await addClient(data); toast.success("Client added"); }} />
      )}
      {learningDialog && (
        <LearningDialog open onClose={() => setLearningDialog(false)}
          campaignOptions={campaignOptions} tagSuggestions={tagSuggestions}
          onSave={async (data) => { await addLearning(data); toast.success("Learning logged 💡"); }} />
      )}
    </>
  );
}

// ═══ Hero ═══════════════════════════════════════════════════
function Hero({ activeClients, activeCampaigns, lessons, spend }: {
  activeClients: number; activeCampaigns: number; lessons: number; spend: number;
}) {
  const tape = [
    { label: "Active Clients", value: String(activeClients).padStart(2, "0"), accent: true, icon: Users },
    { label: "Active Campaigns", value: String(activeCampaigns).padStart(2, "0"), icon: Rocket },
    { label: "Lessons Logged", value: String(lessons).padStart(2, "0"), icon: Lightbulb },
    { label: "Spend Tracked", value: moneyCompact(spend), icon: Megaphone },
  ];
  return (
    <div className="relative border border-white/10 bg-[#080808] overflow-hidden">
      <div className="h-1 w-full" style={{ background: HAZARD }} />
      <Megaphone className="absolute -right-6 -bottom-8 w-52 h-52 text-white/[0.03] -rotate-12 pointer-events-none" strokeWidth={1} />
      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2 text-[#FFD600]">
          <Megaphone className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Marketing Journal</span>
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-[0.02em] text-white leading-none">
          Every client<span className="text-white/30"> · </span>every campaign<span className="text-white/30"> · </span>every lesson<span className="text-[#FFD600]">.</span>
        </h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          {tape.map((t, i) => (
            <div key={t.label}
              className={cn("py-4 sm:py-3 px-1 border-white/10", i > 0 && "sm:border-l", i % 2 === 1 && "border-l sm:border-l", i < 2 && "border-b sm:border-b-0")}>
              <div className={cn("text-4xl sm:text-5xl font-black tabular-nums leading-none font-numeric", t.accent && Number(t.value) > 0 ? "text-[#FFD600]" : "text-white")}>
                {t.value}
              </div>
              <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ Client card ════════════════════════════════════════════
function ClientCard({ client, activeServices, totalServices, campaignCount }: {
  client: MktClient; activeServices: number; totalServices: number; campaignCount: number;
}) {
  const st = CLIENT_STATUS[client.status];
  return (
    <Link href={`/marketing-journal/client/${client.id}`}
      className="group relative flex flex-col border border-white/10 bg-[#080808] hover:border-white/25 transition-colors duration-150 h-full">
      <div className="h-[3px] w-full" style={{ background: client.color ?? "#FFD600" }} />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <ClientAvatar client={client} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-black uppercase tracking-[0.01em] text-white leading-snug truncate">{client.name}</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 mt-0.5 truncate">
              {[client.industry, client.city].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-[#FFD600] transition-colors flex-shrink-0" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Pill label={st.label} color={st.color} />
          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.1em] text-white/40 font-numeric">
            <span>{activeServices}/{totalServices} svc</span>
            <span>{campaignCount} camp</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
