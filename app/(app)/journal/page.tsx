"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, addDays, subDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, BarChart2, AlertTriangle, Lightbulb, Rocket } from "lucide-react";
import Link from "next/link";

import { Topbar }           from "@/components/layout/topbar";
import { PageShell }        from "@/components/shared/page-shell";
import { MoodPicker }       from "@/components/journal/mood-picker";
import { EnergyPicker }     from "@/components/journal/energy-picker";
import { FreeWrite }        from "@/components/journal/free-write";
import { ListSection }      from "@/components/journal/list-section";
import { TomorrowFocus }    from "@/components/journal/tomorrow-focus";
import { HabitsRow }        from "@/components/journal/habits-row";
import { ProblemSection }   from "@/components/journal/problem-section";
import { CalendarStrip }    from "@/components/journal/calendar-strip";
import { OneProjectBanner } from "@/components/journal/one-project-banner";
import { DeepWorkSection }  from "@/components/journal/deep-work-section";
import { ShipLogSection }   from "@/components/journal/ship-log-section";
import { UrgeLogSection }   from "@/components/journal/urge-log-section";
import { TodoSection }      from "@/components/journal/todo-section";
import { HourLogSection }   from "@/components/journal/hour-log-section";
import { MmaChallengeSection } from "@/components/journal/mma-challenge-section";
import { WeeklyScorecard }  from "@/components/journal/weekly-scorecard";

import { useJournal }         from "@/lib/hooks/use-journal";
import { exportEntryAsMarkdown, downloadMarkdown } from "@/lib/journal-export";
import type { JournalEntryInput } from "@/lib/db/schemas";

type SaveStatus = "idle" | "saving" | "saved";

function SectionCard({
  label,
  accent,
  children,
}: {
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/8 bg-white/[0.018]">
      {/* Section header */}
      <div className="flex items-center gap-0 border-b border-white/8">
        <div
          className="w-0.5 self-stretch"
          style={{ backgroundColor: accent ?? "#FFD600" }}
        />
        <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white">
          {label}
        </span>
      </div>
      {/* Content */}
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const todayStr     = format(new Date(), "yyyy-MM-dd");
  const dateStr      = searchParams.get("date") ?? todayStr;

  const { entries, problems, habits, currentEntry, loading, loadEntry, saveEntry, loadEntries, loadProblems } = useJournal();

  const [draft, setDraft] = useState<JournalEntryInput>({
    date: dateStr,
    mood: undefined, energy: undefined,
    freeWrite: "", wins: [], ideas: [], tomorrowFocus: "", habits: {},
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the entry for this date and hydrate the editable draft exactly ONCE
  // per date — right after the load settles. We deliberately do NOT keep the
  // draft in sync with `currentEntry`: auto-save updates currentEntry, and
  // re-hydrating from it would race with in-progress typing and drop the
  // characters typed during the save's round-trip.
  useEffect(() => {
    let cancelled = false;
    loadEntries({ since: format(subDays(new Date(), 60), "yyyy-MM-dd") });
    loadProblems({ entryDate: dateStr });
    (async () => {
      await loadEntry(dateStr);
      if (cancelled) return; // user navigated to another date before load finished
      const entry = useJournal.getState().currentEntry;
      if (entry && entry.date === dateStr) {
        setDraft({
          date:          entry.date,
          mood:          entry.mood,
          energy:        entry.energy,
          freeWrite:     entry.freeWrite     ?? "",
          wins:          entry.wins          ?? [],
          ideas:         entry.ideas         ?? [],
          tomorrowFocus: entry.tomorrowFocus ?? "",
          habits:        entry.habits        ?? {},
        });
      } else {
        setDraft({ date: dateStr, mood: undefined, energy: undefined, freeWrite: "", wins: [], ideas: [], tomorrowFocus: "", habits: {} });
      }
    })();
    return () => { cancelled = true; };
  }, [dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function goPrev() { router.push(`/journal?date=${format(subDays(parseISO(dateStr), 1), "yyyy-MM-dd")}`); }
  function goNext() {
    const next = addDays(parseISO(dateStr), 1);
    if (format(next, "yyyy-MM-dd") <= todayStr) router.push(`/journal?date=${format(next, "yyyy-MM-dd")}`);
  }

  const isToday = dateStr === todayStr;
  const todayProblems = useMemo(() => problems.filter((p) => p.entryDate === dateStr), [problems, dateStr]);

  function handleExport() {
    if (!currentEntry) return;
    const md = exportEntryAsMarkdown(currentEntry, todayProblems, habits);
    downloadMarkdown(`journal-${dateStr}.md`, md);
  }

  return (
    <>
      <Topbar
        title="Journal"
        subtitle={isToday ? "Today" : format(parseISO(dateStr), "EEE, d MMM yyyy")}
      />

      <PageShell>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 max-w-5xl">

          {/* ── Left Panel ───────────────────────────────────── */}
          <div className="lg:sticky lg:top-16 lg:self-start space-y-5">
            {/* Calendar card */}
            <div className="border border-white/10 bg-white/[0.018] p-4">
              <CalendarStrip
                entries={entries}
                activeDate={dateStr}
                currentMonth={parseISO(dateStr)}
              />
            </div>

            {/* Weekly Scorecard */}
            <WeeklyScorecard date={dateStr} />

            {/* Quick nav links */}
            <div className="border border-white/8 bg-white/[0.018]">
              <Link
                href="/journal/problems"
                className="flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-[0.12em] uppercase text-white hover:text-white hover:bg-white/[0.05] transition-all border-b border-white/8 group"
              >
                <AlertTriangle className="w-3.5 h-3.5 group-hover:text-[#FFD600] transition-colors" />
                Problem Log
              </Link>
              <Link
                href="/journal/ships"
                className="flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-[0.12em] uppercase text-white hover:text-white hover:bg-white/[0.05] transition-all border-b border-white/8 group"
              >
                <Rocket className="w-3.5 h-3.5 group-hover:text-[#9B59B6] transition-colors" />
                Ship Log
              </Link>
              <Link
                href="/journal/ideas"
                className="flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-[0.12em] uppercase text-white hover:text-white hover:bg-white/[0.05] transition-all border-b border-white/8 group"
              >
                <Lightbulb className="w-3.5 h-3.5 group-hover:text-[#00C9A7] transition-colors" />
                Ideas
              </Link>
              <Link
                href="/journal/insights"
                className="flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-[0.12em] uppercase text-white hover:text-white hover:bg-white/[0.05] transition-all group"
              >
                <BarChart2 className="w-3.5 h-3.5 group-hover:text-[#FFD600] transition-colors" />
                Insights
              </Link>
            </div>
          </div>

          {/* ── Right Panel ──────────────────────────────────── */}
          <div className="space-y-0 min-w-0">

            {/* Entry date header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-white/80 hover:border-white/25 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  {isToday && (
                    <div className="w-1.5 h-1.5 bg-[#FFD600]" style={{ boxShadow: "0 0 6px rgba(255,214,0,0.6)" }} />
                  )}
                  <span className="text-sm font-black tracking-[0.08em] uppercase text-white/90">
                    {format(parseISO(dateStr), "EEE, d MMM yyyy")}
                  </span>
                </div>
                <button
                  onClick={goNext}
                  disabled={isToday}
                  className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-white/80 hover:border-white/25 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/60">
                    Saving…
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-[9px] font-black tracking-[0.12em] uppercase text-[#6BD98A]">
                    ✓ Saved
                  </span>
                )}
                {currentEntry && (
                  <button
                    onClick={handleExport}
                    title="Download as Markdown"
                    className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/55 hover:text-white/65 hover:border-white/22 transition-all cursor-pointer"
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
              className="space-y-3"
            >
              {/* THE ONE PROJECT — always visible at top */}
              <OneProjectBanner />

              {/* Mood + Energy side-by-side on wider screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SectionCard label="Mood">
                  <MoodPicker
                    value={draft.mood}
                    onChange={(v) => update({ mood: v || undefined })}
                  />
                </SectionCard>

                <SectionCard label="Energy">
                  <EnergyPicker
                    value={draft.energy}
                    onChange={(v) => update({ energy: v || undefined })}
                  />
                </SectionCard>
              </div>

              {/* Deep Work Timer */}
              <SectionCard label="Deep Work" accent="#00D9FF">
                <DeepWorkSection entryDate={dateStr} />
              </SectionCard>

              {/* To-Do — incomplete items carry forward to today automatically */}
              <SectionCard label="To-Do" accent="#4F9DFF">
                <TodoSection entryDate={dateStr} today={todayStr} />
              </SectionCard>

              {/* Hourly Log — rigid 9 AM–7 PM blocks, one note per hour */}
              <SectionCard label="Hourly Log" accent="#F59E0B">
                <HourLogSection entryDate={dateStr} today={todayStr} />
              </SectionCard>

              {/* 90-Day MMA Fight Camp — rest days are Sunday + Monday */}
              <SectionCard label="90-Day Fight Camp" accent="#E60012">
                <MmaChallengeSection entryDate={dateStr} today={todayStr} />
              </SectionCard>

              <SectionCard label="Free Write">
                <FreeWrite
                  value={draft.freeWrite ?? ""}
                  onChange={(v) => update({ freeWrite: v })}
                />
              </SectionCard>

              <SectionCard label="Wins" accent="#6BD98A">
                <ListSection
                  items={draft.wins}
                  onChange={(wins) => update({ wins })}
                  placeholder="What went well today?"
                />
              </SectionCard>

              {/* Ship Log */}
              <SectionCard label="Ship Log" accent="#9B59B6">
                <ShipLogSection entryDate={dateStr} />
              </SectionCard>

              <SectionCard label="Problem Log" accent="#E60012">
                <ProblemSection
                  entryDate={dateStr}
                  problems={todayProblems}
                />
              </SectionCard>

              <SectionCard label="Ideas" accent="#00C9A7">
                <ListSection
                  items={draft.ideas}
                  onChange={(ideas) => update({ ideas })}
                  placeholder="Random idea…"
                />
              </SectionCard>

              {/* Urge Log */}
              <SectionCard label="Urge Log" accent="#FF3366">
                <UrgeLogSection entryDate={dateStr} />
              </SectionCard>

              <SectionCard label="Tomorrow's Focus" accent="#FF6600">
                <TomorrowFocus
                  value={draft.tomorrowFocus ?? ""}
                  onChange={(v) => update({ tomorrowFocus: v })}
                />
              </SectionCard>

              <SectionCard label="Habits" accent="#FFD600">
                <HabitsRow
                  habits={habits}
                  checked={draft.habits}
                  onChange={(h) => update({ habits: h })}
                />
              </SectionCard>
            </motion.div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
