"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Plus, Swords, Play, Scale, Wind, Zap, Pencil, Trash2,
  Check, RotateCcw, ArrowUpRight, ArrowDownRight, Target, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricChart } from "@/components/mma-journal/metric-chart";
import { SegmentMeter } from "@/components/mma-journal/segment-meter";
import { MistakeDialog } from "@/components/mma-journal/mistake-dialog";
import { VideoDialog } from "@/components/mma-journal/video-dialog";
import { MetricDialog } from "@/components/mma-journal/metric-dialog";
import {
  useMmaJournal, ratingLabel, AGILITY_LABELS, POWER_LABELS,
} from "@/components/mma-journal/mma-journal-store";
import {
  youtubeThumb,
  type MmaMistake, type MmaVideo, type MmaMetric,
  type MetricType, type MistakeStatus,
} from "@/lib/db/mma-journal-repository";
import { cn } from "@/lib/utils";

const METRIC_COLOR: Record<MetricType, string> = {
  weight: "#FFD600",  // signal yellow
  agility: "#FFFFFF", // speed = white
  power: "#E60012",   // construct red
};

const HAZARD = "repeating-linear-gradient(45deg, #FFD600 0 10px, #0a0a0a 10px 20px)";

type MistakeFilter = "all" | "working" | "fixed";

export default function MmaJournalPage() {
  const {
    mistakes, videos, metrics, loaded, load,
    addMistake, editMistake, removeMistake,
    addVideo, editVideo, removeVideo,
    addMetric,
  } = useMmaJournal();

  const [mistakeDialog, setMistakeDialog] = useState(false);
  const [editingMistake, setEditingMistake] = useState<MmaMistake | undefined>();
  const [videoDialog, setVideoDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<MmaVideo | undefined>();
  const [metricType, setMetricType] = useState<MetricType | null>(null);
  const [filter, setFilter] = useState<MistakeFilter>("all");

  useEffect(() => { load(); }, []);

  const workingCount = mistakes.filter((m) => m.status === "working").length;
  const fixedCount = mistakes.filter((m) => m.status === "fixed").length;
  const filteredMistakes = mistakes.filter((m) => filter === "all" || m.status === filter);

  async function toggleStatus(m: MmaMistake) {
    const next: MistakeStatus = m.status === "working" ? "fixed" : "working";
    await editMistake(m.id, { status: next });
    toast.success(next === "fixed" ? "Weakness closed out 🥊" : "Back in the lab");
  }

  return (
    <>
      <Topbar
        title="MMA Journal"
        subtitle={`${workingCount} in the lab · ${fixedCount} fixed · ${videos.length} lessons`}
        actions={
          <Button onClick={() => { setEditingMistake(undefined); setMistakeDialog(true); }} size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] h-8 gap-1.5 transition-colors duration-150">
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Log Mistake
          </Button>
        }
      />

      <PageShell className="space-y-10">
        {/* ══ HERO — Tale of the Tape ═══════════════════════ */}
        <Hero
          toFix={workingCount}
          fixed={fixedCount}
          videos={videos.length}
          logged={metrics.length}
        />

        {/* ══ 01 · PROGRESS ═════════════════════════════════ */}
        <section>
          <SectionHead index="01" title="Progress" meta="Weight · Agility · Power" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <MetricCard type="weight" label="Weight" icon={Scale} metrics={metrics} onLog={() => setMetricType("weight")} />
            <MetricCard type="agility" label="Agility" icon={Wind} metrics={metrics} onLog={() => setMetricType("agility")} />
            <MetricCard type="power" label="Power" icon={Zap} metrics={metrics} onLog={() => setMetricType("power")} />
          </div>
        </section>

        {/* ══ 02 · MISTAKES & FIXES ═════════════════════════ */}
        <section>
          <SectionHead index="02" title="Mistakes & Fixes" meta={`${mistakes.length} logged`}>
            <div className="flex">
              {(["all", "working", "fixed"] as MistakeFilter[]).map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  className={cn(
                    "px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border transition-colors duration-150 -ml-px first:ml-0",
                    filter === t
                      ? "bg-[#FFD600] text-black border-[#FFD600] z-10"
                      : "bg-transparent text-white/45 border-white/12 hover:text-white/80 hover:border-white/25"
                  )}>
                  {t === "working" ? "In Lab" : t}
                </button>
              ))}
            </div>
          </SectionHead>

          {!loaded ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 skeleton" />)}
            </div>
          ) : filteredMistakes.length === 0 ? (
            <EmptyState icon={<Swords className="w-6 h-6" />}
              title={filter === "all" ? "No weaknesses logged yet" : `Nothing "${filter === "working" ? "in lab" : filter}"`}
              description={filter === "all" ? "After every session, log what broke down and the drill to fix it." : undefined}
              action={filter === "all" ? (
                <Button onClick={() => { setEditingMistake(undefined); setMistakeDialog(true); }} size="sm"
                  className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] gap-1.5">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Log Mistake
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid gap-2">
              <AnimatePresence mode="popLayout">
                {filteredMistakes.map((m, i) => (
                  <motion.div key={m.id} layout
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18, ease: "linear" }}
                  >
                    <MistakeCard
                      mistake={m} index={filteredMistakes.length - i}
                      onToggle={() => toggleStatus(m)}
                      onEdit={() => { setEditingMistake(m); setMistakeDialog(true); }}
                      onRemove={async () => { if (!confirm("Delete this entry?")) return; await removeMistake(m.id); toast.success("Deleted"); }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ══ 03 · TECHNIQUE LIBRARY ════════════════════════ */}
        <section>
          <SectionHead index="03" title="Technique Library" meta={`${videos.length} saved`}>
            <button onClick={() => { setEditingVideo(undefined); setVideoDialog(true); }}
              className="flex items-center gap-1.5 px-3 h-7 text-[10px] font-black uppercase tracking-[0.1em] border border-white/12 text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600] transition-colors duration-150">
              <Plus className="w-3 h-3" strokeWidth={3} /> Save Video
            </button>
          </SectionHead>

          {loaded && videos.length === 0 ? (
            <EmptyState icon={<Play className="w-6 h-6" />}
              title="No lessons in the vault"
              description="Save YouTube breakdowns and drills so you can rewatch and study them."
              action={
                <Button onClick={() => { setEditingVideo(undefined); setVideoDialog(true); }} size="sm"
                  className="bg-[#FFD600] hover:bg-[#FFE44D] text-black font-black uppercase tracking-[0.08em] gap-1.5">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Save Video
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {videos.map((v, i) => (
                  <motion.div key={v.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.03, duration: 0.2, ease: "linear" }}
                  >
                    <VideoCard v={v}
                      onEdit={() => { setEditingVideo(v); setVideoDialog(true); }}
                      onRemove={async () => { if (!confirm("Remove this lesson?")) return; await removeVideo(v.id); toast.success("Removed"); }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </PageShell>

      {/* ══ Dialogs ═══════════════════════════════════════ */}
      {(mistakeDialog || editingMistake) && (
        <MistakeDialog open existing={editingMistake}
          onClose={() => { setMistakeDialog(false); setEditingMistake(undefined); }}
          onSave={async (data) => {
            if (editingMistake) { await editMistake(editingMistake.id, data); toast.success("Updated"); }
            else { await addMistake(data); toast.success("Logged 🥊"); }
          }}
          onDelete={editingMistake ? async () => {
            await removeMistake(editingMistake.id); setMistakeDialog(false); setEditingMistake(undefined); toast.success("Deleted");
          } : undefined}
        />
      )}
      {(videoDialog || editingVideo) && (
        <VideoDialog open existing={editingVideo}
          onClose={() => { setVideoDialog(false); setEditingVideo(undefined); }}
          onSave={async (data) => {
            if (editingVideo) { await editVideo(editingVideo.id, data); toast.success("Updated"); }
            else { await addVideo(data); toast.success("Saved"); }
          }}
          onDelete={editingVideo ? async () => {
            await removeVideo(editingVideo.id); setVideoDialog(false); setEditingVideo(undefined); toast.success("Removed");
          } : undefined}
        />
      )}
      {metricType && (
        <MetricDialog open type={metricType} color={METRIC_COLOR[metricType]}
          defaultUnit={latestWeightUnit(metrics)}
          onClose={() => setMetricType(null)}
          onSave={async (data) => { await addMetric(data); toast.success("Logged"); }}
        />
      )}
    </>
  );
}

// ═══ Hero ═══════════════════════════════════════════════════
function Hero({ toFix, fixed, videos, logged }: {
  toFix: number; fixed: number; videos: number; logged: number;
}) {
  const tape: { label: string; value: number; accent?: boolean }[] = [
    { label: "In the Lab", value: toFix, accent: true },
    { label: "Fixed", value: fixed },
    { label: "Lessons", value: videos },
    { label: "Logs", value: logged },
  ];
  return (
    <div className="relative border border-white/10 bg-[#080808] overflow-hidden">
      {/* hazard signature strip */}
      <div className="h-1 w-full" style={{ background: HAZARD }} />
      {/* oversized watermark */}
      <Swords className="absolute -right-6 -bottom-8 w-52 h-52 text-white/[0.03] rotate-12 pointer-events-none" strokeWidth={1} />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2 text-[#FFD600]">
          <Target className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.24em]">Daily War Log</span>
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-[0.02em] text-white leading-none">
          Sharpen one weakness<span className="text-[#FFD600]">.</span> every<span className="text-white/30"> · </span>single<span className="text-white/30"> · </span>day<span className="text-[#FFD600]">.</span>
        </h2>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          {tape.map((t, i) => (
            <div key={t.label}
              className={cn(
                "py-4 sm:py-3 px-1 border-white/10",
                i > 0 && "sm:border-l",
                i % 2 === 1 && "border-l sm:border-l",
                i < 2 && "border-b sm:border-b-0"
              )}>
              <div className={cn("text-4xl sm:text-5xl font-black tabular-nums leading-none font-numeric",
                t.accent && t.value > 0 ? "text-[#FFD600]" : "text-white")}>
                {String(t.value).padStart(2, "0")}
              </div>
              <div className="mt-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ Section header ═════════════════════════════════════════
function SectionHead({ index, title, meta, children }: {
  index: string; title: string; meta?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-black tabular-nums text-[#FFD600] font-numeric">{index}</span>
      <h2 className="text-[13px] font-black uppercase tracking-[0.16em] text-white whitespace-nowrap">{title}</h2>
      {meta && <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 whitespace-nowrap hidden sm:block">{meta}</span>}
      <div className="flex-1 h-px bg-white/10" />
      {children}
    </div>
  );
}

// ═══ Metric card ════════════════════════════════════════════
function latestWeightUnit(metrics: MmaMetric[]) {
  const w = metrics.filter((m) => m.type === "weight");
  return w.length ? w[w.length - 1].unit ?? "kg" : "kg";
}

function MetricCard({ type, label, icon: Icon, metrics, onLog }: {
  type: MetricType; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  metrics: MmaMetric[]; onLog: () => void;
}) {
  const color = METRIC_COLOR[type];
  const isRating = type !== "weight";
  const series = metrics.filter((m) => m.type === type).sort((a, b) => a.date.localeCompare(b.date));
  const latest = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = latest && prev ? latest.value - prev.value : null;
  const labels = type === "agility" ? AGILITY_LABELS : POWER_LABELS;

  return (
    <div className="group relative border border-white/10 bg-[#080808] hover:border-white/20 transition-colors duration-150">
      {/* accent top bar */}
      <div className="h-[3px] w-full" style={{ background: latest ? color : "rgba(255,255,255,0.12)" }} />

      <div className="p-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{label}</span>
          </div>
          <button onClick={onLog}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/40 hover:text-black hover:bg-[#FFD600] border border-white/12 hover:border-[#FFD600] px-2 py-1 transition-colors duration-150 cursor-pointer">
            <Plus className="w-3 h-3" strokeWidth={3} /> Log
          </button>
        </div>

        {/* value row */}
        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black tabular-nums leading-none font-numeric" style={{ color: latest ? color : "rgba(255,255,255,0.25)" }}>
              {latest ? (isRating ? latest.value : latest.value) : "--"}
            </span>
            <span className="text-sm font-black text-white/35 uppercase">
              {latest ? (isRating ? "/10" : (latest.unit ?? "")) : ""}
            </span>
          </div>
          {delta !== null && delta !== 0 && (
            <DeltaChip delta={delta} isRating={isRating} color={color} rating={isRating} />
          )}
        </div>

        {/* rating label + meter, or weight caption */}
        {isRating ? (
          <div className="mt-3 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: latest ? color : "rgba(255,255,255,0.3)" }}>
              {latest ? ratingLabel(latest.value, labels) : "Not rated yet"}
            </div>
            <SegmentMeter value={latest?.value ?? 0} color={color} />
          </div>
        ) : (
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
            {latest ? `Last · ${format(parseISO(latest.date), "MMM d")}` : "No entries yet"}
          </div>
        )}

        {/* trend */}
        <div className="mt-4 pt-3 border-t border-white/8">
          <MetricChart metrics={metrics} type={type} color={color} />
        </div>
      </div>
    </div>
  );
}

function DeltaChip({ delta, isRating, color, rating }: { delta: number; isRating: boolean; color: string; rating: boolean }) {
  const up = delta > 0;
  // Ratings: up = good (accent), down = red. Weight: neutral white.
  const c = rating ? (up ? color : "#E60012") : "rgba(255,255,255,0.5)";
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-0.5 text-xs font-black tabular-nums mb-1 font-numeric" style={{ color: c }}>
      <Arrow className="w-3.5 h-3.5" strokeWidth={3} />
      {Math.abs(delta).toFixed(isRating ? 0 : 1)}
    </span>
  );
}

// ═══ Mistake card ═══════════════════════════════════════════
function MistakeCard({ mistake, index, onToggle, onEdit, onRemove }: {
  mistake: MmaMistake; index: number; onToggle: () => void; onEdit: () => void; onRemove: () => void;
}) {
  const fixed = mistake.status === "fixed";
  return (
    <div className={cn(
      "group relative flex border bg-[#080808] transition-colors duration-150",
      fixed ? "border-white/8" : "border-white/12 hover:border-white/25"
    )}>
      {/* status spine */}
      <div className="w-1 flex-shrink-0" style={{ background: fixed ? "rgba(255,255,255,0.15)" : "#FFD600" }} />

      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black tabular-nums text-white/25 font-numeric">
                #{String(index).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 border border-white/15 text-white/70">
                {mistake.category}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/30 font-numeric">
                {format(parseISO(mistake.date), "MMM d")}
              </span>
              {fixed && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] px-1.5 py-0.5 text-black bg-white/70">
                  <Check className="w-2.5 h-2.5" strokeWidth={4} /> Fixed
                </span>
              )}
            </div>
            <h3 className={cn("text-[15px] font-black uppercase tracking-[0.01em] mt-2 leading-snug",
              fixed ? "text-white/40 line-through" : "text-white")}>
              {mistake.title}
            </h3>
          </div>

          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <IconBtn onClick={onToggle} title={fixed ? "Reopen" : "Mark fixed"}>
              {fixed ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </IconBtn>
            <IconBtn onClick={onEdit} title="Edit"><Pencil className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn onClick={onRemove} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
          </div>
        </div>

        {(mistake.whatHappened || mistake.howToFix) && (
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {mistake.whatHappened && (
              <div className="border-l border-white/12 pl-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 mb-1">What Happened</p>
                <p className="text-xs text-white/65 leading-relaxed whitespace-pre-wrap">{mistake.whatHappened}</p>
              </div>
            )}
            {mistake.howToFix && (
              <div className="border-l-2 border-[#FFD600] pl-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#FFD600] mb-1">The Fix</p>
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{mistake.howToFix}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ Video card ═════════════════════════════════════════════
function VideoCard({ v, onEdit, onRemove }: { v: MmaVideo; onEdit: () => void; onRemove: () => void }) {
  const thumb = youtubeThumb(v.url);
  return (
    <div className="group relative border border-white/10 bg-[#080808] hover:border-[#FFD600]/50 transition-colors duration-150">
      {/* actions */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <IconBtn solid onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} title="Edit"><Pencil className="w-3 h-3" /></IconBtn>
        <IconBtn solid danger onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} title="Delete"><Trash2 className="w-3 h-3" /></IconBtn>
      </div>

      <a href={v.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
        <div className="relative aspect-video bg-[#111] overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={v.title} className="w-full h-full object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-white/15" /></div>
          )}
          {/* scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
          {/* category badge */}
          <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-[0.14em] px-1.5 py-0.5 bg-black/70 text-[#FFD600] border border-[#FFD600]/30 z-10">
            {v.category}
          </span>
          {/* play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 flex items-center justify-center bg-[#FFD600] translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-xs font-black uppercase tracking-[0.02em] text-white leading-snug line-clamp-2 min-h-[2rem]">{v.title}</h3>
          {v.notes && <p className="mt-1.5 text-[10px] text-white/45 leading-relaxed line-clamp-2">{v.notes}</p>}
          <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/25 group-hover:text-[#FFD600] transition-colors duration-150">
            Watch <ExternalLink className="w-2.5 h-2.5" />
          </div>
        </div>
      </a>
    </div>
  );
}

// ═══ Icon button ════════════════════════════════════════════
function IconBtn({ children, onClick, title, danger, solid }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean; solid?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn(
        "w-7 h-7 flex items-center justify-center border transition-colors duration-150 cursor-pointer",
        solid ? "bg-black/70 border-white/15" : "bg-transparent border-white/12",
        danger ? "text-white/70 hover:text-white hover:bg-[#E60012] hover:border-[#E60012]"
               : "text-white/70 hover:text-black hover:bg-[#FFD600] hover:border-[#FFD600]"
      )}>
      {children}
    </button>
  );
}
