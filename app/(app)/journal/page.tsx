"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, subDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

import { Topbar }   from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { MoodPicker }     from "@/components/journal/mood-picker";
import { EnergyPicker }   from "@/components/journal/energy-picker";
import { FreeWrite }      from "@/components/journal/free-write";
import { ListSection }    from "@/components/journal/list-section";
import { TomorrowFocus }  from "@/components/journal/tomorrow-focus";
import { HabitsRow }      from "@/components/journal/habits-row";
import { ProblemSection } from "@/components/journal/problem-section";
import { CalendarStrip }  from "@/components/journal/calendar-strip";

import { useJournal }         from "@/lib/hooks/use-journal";
import { exportEntryAsMarkdown, downloadMarkdown } from "@/lib/journal-export";
import type { JournalEntryInput } from "@/lib/db/schemas";

type SaveStatus = "idle" | "saving" | "saved";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/60 mb-2">
      {children}
    </p>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const todayStr     = format(new Date(), "yyyy-MM-dd");
  const dateStr      = searchParams.get("date") ?? todayStr;

  const { entries, problems, habits, currentEntry, loading, loadEntry, saveEntry, loadEntries, loadProblems } = useJournal();

  // Local draft state
  const [draft, setDraft] = useState<JournalEntryInput>({
    date: dateStr,
    mood: undefined, energy: undefined,
    freeWrite: "", wins: [], ideas: [], tomorrowFocus: "", habits: {},
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on date change
  useEffect(() => {
    loadEntry(dateStr);
    loadEntries({ since: format(subDays(new Date(), 60), "yyyy-MM-dd") });
    loadProblems({ entryDate: dateStr });
  }, [dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync currentEntry → draft
  useEffect(() => {
    if (currentEntry) {
      setDraft({
        date:          currentEntry.date,
        mood:          currentEntry.mood,
        energy:        currentEntry.energy,
        freeWrite:     currentEntry.freeWrite  ?? "",
        wins:          currentEntry.wins        ?? [],
        ideas:         currentEntry.ideas       ?? [],
        tomorrowFocus: currentEntry.tomorrowFocus ?? "",
        habits:        currentEntry.habits      ?? {},
      });
    } else {
      setDraft({ date: dateStr, mood: undefined, energy: undefined, freeWrite: "", wins: [], ideas: [], tomorrowFocus: "", habits: {} });
    }
  }, [currentEntry, dateStr]);

  // Auto-save debounce
  const autoSave = useCallback((data: JournalEntryInput) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await saveEntry(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  }, [saveEntry]);

  function update(patch: Partial<JournalEntryInput>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    autoSave(next);
  }

  // Date nav
  function goPrev() { router.push(`/journal?date=${format(subDays(parseISO(dateStr), 1), "yyyy-MM-dd")}`); }
  function goNext() {
    const next = addDays(parseISO(dateStr), 1);
    if (format(next, "yyyy-MM-dd") <= todayStr) router.push(`/journal?date=${format(next, "yyyy-MM-dd")}`);
  }

  const isToday = dateStr === todayStr;

  // Today's problems
  const todayProblems = useMemo(() => problems.filter((p) => p.entryDate === dateStr), [problems, dateStr]);

  function handleExport() {
    if (!currentEntry) return;
    const md = exportEntryAsMarkdown(currentEntry, todayProblems, habits);
    downloadMarkdown(`journal-${dateStr}.md`, md);
  }

  const dateLabel = format(parseISO(dateStr), "EEE, d MMM yyyy");
  const monthEntries = entries.filter((e) => e.date.startsWith(dateStr.slice(0, 7)));

  return (
    <>
      <Topbar
        title="Journal"
        subtitle={isToday ? "Today" : dateLabel}
      />

      <PageShell>
        <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-6 max-w-5xl">

          {/* ── Left Panel ───────────────────────────────────── */}
          <div className="lg:sticky lg:top-16 lg:self-start space-y-4">
            <CalendarStrip
              entries={entries}
              activeDate={dateStr}
              currentMonth={parseISO(dateStr)}
            />

            <div className="border-t border-white/8 pt-4 space-y-2">
              <Link
                href="/journal/problems"
                className="flex items-center gap-2 text-[10px] font-black tracking-[0.1em] uppercase text-white/35 hover:text-white/60 transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                Problem Log
              </Link>
              <Link
                href="/journal/insights"
                className="flex items-center gap-2 text-[10px] font-black tracking-[0.1em] uppercase text-white/35 hover:text-white/60 transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                Insights
              </Link>
            </div>
          </div>

          {/* ── Right Panel ──────────────────────────────────── */}
          <div className="space-y-8 min-w-0">

            {/* Entry header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={goPrev} className="text-white/30 hover:text-white/60 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-black tracking-[0.06em] uppercase text-white/80">
                  {format(parseISO(dateStr), "EEE, d MMM yyyy")}
                </span>
                <button
                  onClick={goNext}
                  disabled={isToday}
                  className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="text-[9px] font-black tracking-[0.1em] uppercase text-white/25">Saving…</span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-[9px] font-black tracking-[0.1em] uppercase text-[#6BD98A]/60">Saved</span>
                )}
                {currentEntry && (
                  <button
                    onClick={handleExport}
                    title="Download as Markdown"
                    className="text-white/25 hover:text-white/50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sections */}
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <Section label="Mood">
                <MoodPicker
                  value={draft.mood}
                  onChange={(v) => update({ mood: v || undefined })}
                />
              </Section>

              <Section label="Energy">
                <EnergyPicker
                  value={draft.energy}
                  onChange={(v) => update({ energy: v || undefined })}
                />
              </Section>

              <Section label="Free Write">
                <FreeWrite
                  value={draft.freeWrite ?? ""}
                  onChange={(v) => update({ freeWrite: v })}
                />
              </Section>

              <Section label="Wins">
                <ListSection
                  items={draft.wins}
                  onChange={(wins) => update({ wins })}
                  placeholder="What went well today?"
                />
              </Section>

              <Section label="Problem Log">
                <ProblemSection
                  entryDate={dateStr}
                  problems={todayProblems}
                />
              </Section>

              <Section label="Ideas">
                <ListSection
                  items={draft.ideas}
                  onChange={(ideas) => update({ ideas })}
                  placeholder="Random idea…"
                />
              </Section>

              <Section label="Tomorrow's Focus">
                <TomorrowFocus
                  value={draft.tomorrowFocus ?? ""}
                  onChange={(v) => update({ tomorrowFocus: v })}
                />
              </Section>

              <Section label="Habits">
                <HabitsRow
                  habits={habits}
                  checked={draft.habits}
                  onChange={(h) => update({ habits: h })}
                />
              </Section>
            </motion.div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
