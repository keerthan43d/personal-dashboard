"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Moon, Swords, Trash2, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCamp,
  startCamp,
  resetCamp,
  listSessions,
  saveSession,
  deleteSession,
  type Camp,
  type Session,
} from "@/lib/db/mma-repository";

const TOTAL_DAYS = 90;
/** Rest days: 0 = Sunday, 1 = Monday. Everything else is a training day. */
const REST_DOW = new Set([0, 1]);
const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const DISCIPLINES = [
  "BOXING",
  "MUAY THAI",
  "BJJ",
  "WRESTLING",
  "MMA",
  "S&C",
  "RUN",
] as const;

type Belt = { name: string; at: number; color: string };
const BELTS: Belt[] = [
  { name: "WHITE",  at: 0.0, color: "#E8E8E8" },
  { name: "BLUE",   at: 0.2, color: "#4F9DFF" },
  { name: "PURPLE", at: 0.4, color: "#9B59B6" },
  { name: "BROWN",  at: 0.6, color: "#A0522D" },
  { name: "BLACK",  at: 0.9, color: "#FFD600" },
];

const TAUNTS = [
  "EVERYBODY HAS A PLAN UNTIL THEY GET PUNCHED.",
  "THE CAGE DOESN'T CARE HOW YOU FEEL.",
  "CHAMPIONS ARE BUILT ON THE DAYS THEY DIDN'T WANT TO.",
  "ROUNDS DON'T LIE.",
  "SHOW UP. THAT'S THE WHOLE SECRET.",
];

function isRestDay(date: Date) {
  return REST_DOW.has(date.getDay());
}

type DayCell = {
  index: number; // 1..90
  date: string;  // yyyy-MM-dd
  rest: boolean;
  session: Session | null;
  status: "trained" | "missed" | "rest" | "pending" | "future";
};

export function MmaChallengeSection({ entryDate, today }: { entryDate: string; today: string }) {
  const [camp, setCamp] = useState<Camp | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Draft for the day currently being viewed.
  const [picked, setPicked] = useState<string[]>([]);
  const [rounds, setRounds] = useState(0);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getCamp(), listSessions()]);
      setCamp(c);
      setSessions(s);
      setBroken(false);
    } catch (e) {
      console.error("[MMA] load error — run migration 0013:", e);
      setBroken(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const sessionMap = useMemo(() => {
    const m = new Map<string, Session>();
    for (const s of sessions) m.set(s.date, s);
    return m;
  }, [sessions]);

  // Hydrate the draft whenever the viewed day (or its saved session) changes.
  useEffect(() => {
    const s = sessionMap.get(entryDate);
    setPicked(s?.disciplines ?? []);
    setRounds(s?.rounds ?? 0);
    setIntensity(s?.intensity ?? null);
    setNote(s?.note ?? "");
  }, [entryDate, sessionMap]);

  const days: DayCell[] = useMemo(() => {
    if (!camp) return [];
    const start = parseISO(camp.startDate);
    return Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const d = addDays(start, i);
      const date = format(d, "yyyy-MM-dd");
      const rest = isRestDay(d);
      const session = sessionMap.get(date) ?? null;
      let status: DayCell["status"];
      if (session) status = "trained";
      else if (rest) status = "rest";
      else if (date < today) status = "missed";
      else if (date === today) status = "pending";
      else status = "future";
      return { index: i + 1, date, rest, session, status };
    });
  }, [camp, sessionMap, today]);

  /**
   * Calendar layout: one column per week, one row per weekday (Sun→Sat).
   * Laid out this way the two rest days read as clean horizontal stripes.
   */
  const weeks: (DayCell | null)[][] = useMemo(() => {
    if (!camp) return [];
    const lead = parseISO(camp.startDate).getDay(); // blank slots before day 1
    const count = Math.ceil((lead + TOTAL_DAYS) / 7);
    return Array.from({ length: count }, (_, w) =>
      Array.from({ length: 7 }, (_, dow) => days[w * 7 + dow - lead] ?? null)
    );
  }, [camp, days]);

  const stats = useMemo(() => {
    const scheduled = days.filter((d) => !d.rest).length;
    const trained = days.filter((d) => d.status === "trained").length;
    const missed = days.filter((d) => d.status === "missed").length;
    const totalRounds = days.reduce((n, d) => n + (d.session?.rounds ?? 0), 0);

    // Streak: walk back from today, ignoring rest days, until a missed day.
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const d = days[i];
      if (d.date > today) continue;
      if (d.rest) continue;
      if (d.status === "trained") streak++;
      else if (d.status === "missed") break;
    }

    const ratio = scheduled > 0 ? trained / scheduled : 0;
    let belt = BELTS[0];
    for (const b of BELTS) if (ratio >= b.at) belt = b;
    const nextBelt = BELTS.find((b) => b.at > belt.at) ?? null;
    const toNext = nextBelt ? Math.max(1, Math.ceil(nextBelt.at * scheduled) - trained) : 0;

    return { scheduled, trained, missed, totalRounds, streak, ratio, belt, nextBelt, toNext };
  }, [days, today]);

  const viewedDate = parseISO(entryDate);
  const viewedRest = isRestDay(viewedDate);
  const dayIndex = camp ? differenceInCalendarDays(viewedDate, parseISO(camp.startDate)) + 1 : 0;
  const inCamp = dayIndex >= 1 && dayIndex <= TOTAL_DAYS;
  const currentIndex = camp
    ? Math.min(TOTAL_DAYS, Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(camp.startDate)) + 1))
    : 0;
  const saved = sessionMap.has(entryDate);
  const taunt = TAUNTS[(dayIndex + 7) % TAUNTS.length];

  function toggleDiscipline(d: string) {
    setPicked((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const s: Session = { date: entryDate, disciplines: picked, rounds, intensity, note: note.trim() };
      await saveSession(s);
      setSessions((prev) => [...prev.filter((x) => x.date !== entryDate), s]);
    } catch (e) {
      console.error("[MMA] save error:", e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteSession(entryDate);
      setSessions((prev) => prev.filter((x) => x.date !== entryDate));
    } catch (e) {
      console.error("[MMA] delete error:", e);
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    try {
      const c = await startCamp(today);
      setCamp(c);
      setBroken(false);
    } catch (e) {
      console.error("[MMA] start error — run migration 0013:", e);
      setBroken(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      await resetCamp();
      setCamp(null);
      setSessions([]);
      setConfirmReset(false);
    } catch (e) {
      console.error("[MMA] reset error:", e);
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/30">Loading camp…</p>;
  }

  if (broken) {
    return (
      <p className="text-[10px] font-black tracking-[0.1em] uppercase text-[#FF6600]/80 leading-relaxed">
        Run migration <span className="text-white">0013_mma_challenge.sql</span> in Supabase to start the camp.
      </p>
    );
  }

  // ── No camp yet: the call-out ──────────────────────────────────
  if (!camp) {
    return (
      <div className="text-center py-6">
        <Swords className="w-7 h-7 mx-auto text-[#E60012] mb-3" strokeWidth={2.5} />
        <p className="text-[13px] font-black tracking-[0.14em] uppercase text-white">90-Day Fight Camp</p>
        <p className="mt-2 text-[10px] font-bold tracking-[0.06em] uppercase text-white/40 leading-relaxed max-w-[340px] mx-auto">
          Train every day except Sunday &amp; Monday. Log the rounds, earn the belts,
          keep the streak alive.
        </p>
        <button
          onClick={handleStart}
          disabled={busy}
          className="mt-4 px-5 py-2.5 bg-[#E60012] text-white text-[10px] font-black tracking-[0.16em] uppercase hover:bg-[#ff1a2b] transition-colors cursor-pointer disabled:opacity-50"
        >
          Step Into The Cage
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Belt + record bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-stretch gap-2">
        {/* Belt */}
        <div className="flex-1 min-w-[150px] border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <p className="text-[8px] font-black tracking-[0.16em] uppercase text-white/35">Rank</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="relative w-8 h-3 flex-shrink-0" style={{ backgroundColor: stats.belt.color }}>
              <div className="absolute right-1 top-0 bottom-0 w-1.5 bg-black/70" />
            </div>
            <span
              className="text-[12px] font-black tracking-[0.1em] uppercase leading-none"
              style={{ color: stats.belt.color }}
            >
              {stats.belt.name} Belt
            </span>
          </div>
          <p className="mt-1.5 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">
            {stats.nextBelt
              ? `${stats.toNext} more session${stats.toNext === 1 ? "" : "s"} → ${stats.nextBelt.name}`
              : "Top of the mountain"}
          </p>
        </div>

        {/* Streak */}
        <div className="w-[92px] border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <p className="text-[8px] font-black tracking-[0.16em] uppercase text-white/35">Streak</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Flame
              className={cn("w-4 h-4", stats.streak > 0 ? "text-[#FF6600]" : "text-white/15")}
              strokeWidth={2.5}
              style={stats.streak > 0 ? { filter: "drop-shadow(0 0 5px rgba(255,102,0,0.6))" } : undefined}
            />
            <span className={cn("text-[18px] font-black tabular-nums leading-none", stats.streak > 0 ? "text-white" : "text-white/25")}>
              {stats.streak}
            </span>
          </div>
        </div>

        {/* Record */}
        <div className="w-[112px] border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <p className="text-[8px] font-black tracking-[0.16em] uppercase text-white/35">Record</p>
          <p className="mt-1.5 text-[18px] font-black tabular-nums leading-none">
            <span className="text-[#6BD98A]">{stats.trained}</span>
            <span className="text-white/25 mx-0.5">–</span>
            <span className="text-[#E60012]">{stats.missed}</span>
          </p>
          <p className="mt-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">
            {stats.totalRounds} rounds
          </p>
        </div>
      </div>

      {/* ── Progress ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black tracking-[0.14em] uppercase text-white/45">
            Day {currentIndex} / {TOTAL_DAYS}
          </span>
          <span className="text-[9px] font-black tracking-[0.14em] uppercase text-white/45 tabular-nums">
            {stats.trained}/{stats.scheduled} sessions
          </span>
        </div>
        <div className="h-1.5 bg-white/8 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: stats.belt.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(stats.ratio * 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── 90-day calendar: a column per week, a row per weekday ─ */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-[3px] w-max">
          {/* Weekday rail */}
          <div className="flex flex-col gap-[3px] mr-1">
            {DOW_LABELS.map((l, dow) => (
              <span
                key={dow}
                className={cn(
                  "w-3 h-4 flex items-center justify-center text-[8px] font-black leading-none",
                  REST_DOW.has(dow) ? "text-[#4F9DFF]/60" : "text-white/25"
                )}
              >
                {l}
              </span>
            ))}
          </div>

          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {week.map((d, dow) => {
                if (!d) return <div key={dow} className="w-4 h-4" />;
                const isViewed = d.date === entryDate;
                const isNow = d.date === today;
                return (
                  <div
                    key={dow}
                    title={`Day ${d.index} · ${format(parseISO(d.date), "EEE d MMM")} · ${
                      d.status === "trained"
                        ? `${d.session?.disciplines.join(", ") || "trained"}${d.session?.rounds ? ` · ${d.session.rounds} rounds` : ""}`
                        : d.status === "rest"
                        ? "rest day"
                        : d.status === "missed"
                        ? "missed"
                        : "upcoming"
                    }`}
                    className={cn(
                      "w-4 h-4 transition-colors",
                      d.status === "trained" && "bg-[#6BD98A]",
                      d.status === "missed" && "bg-[#E60012]/70",
                      d.status === "rest" && "bg-white/[0.06]",
                      d.status === "pending" && "bg-[#FFD600]/30",
                      d.status === "future" && "bg-white/[0.035]",
                      isNow && "ring-1 ring-[#FFD600]",
                      isViewed && !isNow && "ring-1 ring-white/50"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">
        <span className="flex items-center gap-1"><i className="w-2 h-2 bg-[#6BD98A]" /> Trained</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 bg-[#E60012]/70" /> Missed</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 bg-white/[0.06]" /> Rest (Sun/Mon)</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 bg-white/[0.03]" /> Ahead</span>
      </div>

      {/* ── The day being viewed ──────────────────────────────── */}
      <div className="border-t border-white/8 pt-4">
        {!inCamp ? (
          <p className="text-[10px] font-black tracking-[0.1em] uppercase text-white/30">
            This day is outside the 90-day camp.
          </p>
        ) : viewedRest ? (
          <div className="flex items-start gap-3">
            <Moon className="w-5 h-5 text-[#4F9DFF] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <div>
              <p className="text-[11px] font-black tracking-[0.14em] uppercase text-white">
                Rest Day · Day {dayIndex}
              </p>
              <p className="mt-1 text-[9px] font-bold tracking-[0.08em] uppercase text-white/35 leading-relaxed">
                Sundays and Mondays are off. Muscle is built outside the gym — eat, sleep, come back sharper.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white/70">
                Day {dayIndex} · {saved ? "Session logged" : "Log the session"}
              </p>
              {saved && (
                <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.12em] uppercase text-[#6BD98A]">
                  <Check className="w-3 h-3" strokeWidth={3} /> In the books
                </span>
              )}
            </div>

            {/* Disciplines */}
            <div className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => {
                const on = picked.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDiscipline(d)}
                    className={cn(
                      "px-2.5 py-1.5 border text-[9px] font-black tracking-[0.1em] uppercase transition-all cursor-pointer",
                      on
                        ? "border-[#E60012] bg-[#E60012]/15 text-white"
                        : "border-white/12 text-white/40 hover:border-white/30 hover:text-white/70"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Rounds + intensity */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/35">Rounds</span>
                <div className="flex items-center border border-white/12">
                  <button
                    onClick={() => setRounds((r) => Math.max(0, r - 1))}
                    className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-black"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-[13px] font-black tabular-nums text-white">{rounds}</span>
                  <button
                    onClick={() => setRounds((r) => Math.min(50, r + 1))}
                    className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-sm font-black"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/35">Damage</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setIntensity((v) => (v === n ? null : n))}
                      title={["Light", "Steady", "Hard", "Brutal", "Left it all in there"][n - 1]}
                      className={cn(
                        "w-6 h-6 border transition-all cursor-pointer",
                        (intensity ?? 0) >= n
                          ? "border-transparent"
                          : "border-white/12 hover:border-white/30"
                      )}
                      style={
                        (intensity ?? 0) >= n
                          ? { backgroundColor: ["#6BD98A", "#B8D96B", "#FFD600", "#FF6600", "#E60012"][n - 1] }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Note */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you work on? Any breakthroughs, any beatings…"
              autoComplete="off"
              data-1p-ignore
              className="w-full bg-white/[0.02] border border-white/10 px-3 py-2 text-sm text-white/85 placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={busy || (picked.length === 0 && rounds === 0 && !note.trim())}
                className="px-4 py-2 bg-[#E60012] text-white text-[9px] font-black tracking-[0.14em] uppercase hover:bg-[#ff1a2b] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {saved ? "Update Session" : "Mark It Done"}
              </button>
              {saved && (
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  title="Remove this session"
                  className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/40 hover:text-[#E60012] hover:border-[#E60012]/40 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-[8px] font-black tracking-[0.14em] uppercase text-white/20 pt-0.5">{taunt}</p>
          </div>
        )}
      </div>

      {/* ── Camp controls ─────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-white/8 pt-3">
        <span className="text-[8px] font-black tracking-[0.12em] uppercase text-white/25">
          Camp started {format(parseISO(camp.startDate), "d MMM yyyy")} · ends{" "}
          {format(addDays(parseISO(camp.startDate), TOTAL_DAYS - 1), "d MMM yyyy")}
        </span>
        <AnimatePresence mode="wait">
          {confirmReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-[8px] font-black tracking-[0.12em] uppercase text-[#E60012]">Wipe everything?</span>
              <button
                onClick={handleReset}
                disabled={busy}
                className="px-2 py-1 bg-[#E60012] text-white text-[8px] font-black tracking-[0.12em] uppercase cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 border border-white/12 text-white/50 text-[8px] font-black tracking-[0.12em] uppercase cursor-pointer"
              >
                No
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="reset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmReset(true)}
              title="Reset the camp"
              className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.12em] uppercase text-white/25 hover:text-white/60 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Camp
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
