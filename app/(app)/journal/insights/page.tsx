"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { subDays, format, parseISO, eachDayOfInterval } from "date-fns";

import { Topbar }    from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { MoodChart } from "@/components/journal/mood-chart";
import { AiSection } from "@/components/journal/ai-section";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useJournal } from "@/lib/hooks/use-journal";
import { cn } from "@/lib/utils";

type Range = 30 | 90 | 365;

export default function InsightsPage() {
  const { entries, problems, habits, loadEntries, loadProblems, loadHabits } = useJournal();
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    loadEntries({ since: format(subDays(new Date(), 365), "yyyy-MM-dd") });
    loadProblems();
    loadHabits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Habit heatmap — last 30 days per active habit
  const activeHabits = habits.filter((h) => h.active);

  const heatmapDays = useMemo(() => {
    const since = subDays(new Date(), 29);
    return eachDayOfInterval({ start: since, end: new Date() });
  }, []);

  const entryMap = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  );

  return (
    <>
      <Topbar title="Insights" subtitle="Mood, energy, habits" />

      <PageShell>
        <div className="max-w-3xl space-y-6">

          {/* Range toggle */}
          <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as Range)}>
            <TabsList className="bg-white/[0.03] border border-white/8">
              {([30, 90, 365] as Range[]).map((r) => (
                <TabsTrigger
                  key={r}
                  value={String(r)}
                  className="text-[10px] font-black tracking-[0.08em] uppercase data-[state=active]:bg-[#FFD600] data-[state=active]:text-black"
                >
                  {r}d
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Mood & Energy chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-white/8 bg-[#080808] p-4"
          >
            <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/35 mb-4">
              Mood & Energy
            </p>
            <MoodChart entries={entries} days={range} />
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-px bg-[#FFD600]" />
                <span className="text-[9px] font-black tracking-[0.08em] uppercase text-white/30">Mood</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-px bg-white/30 border-dashed border-t" style={{ borderTopStyle: "dashed" }} />
                <span className="text-[9px] font-black tracking-[0.08em] uppercase text-white/30">Energy</span>
              </div>
            </div>
          </motion.div>

          {/* Habit heatmap */}
          {activeHabits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="border border-white/8 bg-[#080808] p-4"
            >
              <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/35 mb-4">
                Habit Streak — Last 30 Days
              </p>
              <div className="space-y-2 overflow-x-auto">
                {activeHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.08em] uppercase text-white/40 w-32 flex-shrink-0 truncate">
                      {habit.name}
                    </span>
                    <div className="flex gap-0.5">
                      {heatmapDays.map((day) => {
                        const ds    = format(day, "yyyy-MM-dd");
                        const entry = entryMap.get(ds);
                        const done  = entry?.habits?.[habit.name] ?? false;
                        return (
                          <div
                            key={ds}
                            title={`${ds}: ${done ? "done" : "skipped"}`}
                            className={cn(
                              "w-4 h-4 flex-shrink-0",
                              done ? "bg-[#FFD600]/70" : "bg-white/6"
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="border border-white/8 bg-[#080808] p-4"
          >
            <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/35 mb-4">
              AI Reflection
            </p>
            <AiSection entries={entries} problems={problems} />
          </motion.div>

        </div>
      </PageShell>
    </>
  );
}
