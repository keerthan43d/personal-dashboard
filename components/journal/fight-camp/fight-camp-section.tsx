"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Flame, RotateCcw, Settings2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActiveCamp, listCamps, startCamp as apiStartCamp, updateCamp,
  listSessions, saveSession as apiSaveSession, deleteSession as apiDeleteSession,
  listExercises, createExercise as apiCreateExercise,
  listFoods, listMeals, createMeal as apiCreateMeal,
  listFoodLog, addFoodEntry as apiAddFoodEntry, deleteFoodEntry as apiDeleteFoodEntry,
  getCheckin, listCheckins, listFoodSince, saveCheckin as apiSaveCheckin,
  getSettings, saveSettings as apiSaveSettings,
  type Camp, type Session, type SessionInput, type Exercise, type Food, type Meal,
  type FoodEntry, type FoodSlot, type MealItem, type Checkin, type Settings, type CampMode,
} from "@/lib/db/fight-camp-repository";
import { computeGame, daySummary, type GameInput } from "@/lib/fight-camp-game";
import { RED, Micro, StatCard, PrimaryBtn, Field } from "./shared";
import { MmaLogger } from "./mma-logger";
import { GymLogger } from "./gym-logger";
import { NutritionBlock } from "./nutrition-block";
import { CheckinBlock } from "./checkin-block";
import { CampHeatmap } from "./camp-heatmap";
import { CutChart } from "./cut-chart";
import {
  HeaderXp, ShieldsStat, OvrStat, BossCard, OnTrackBadge, XpToday, FighterCard, TechniqueCards, Achievements,
} from "./game-blocks";

export function FightCampSection({ entryDate, today }: { entryDate: string; today: string }) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);

  const [camp, setCamp] = useState<Camp | null>(null);
  const [settings, setSettings] = useState<Settings>({ weightUnit: "kg", kcalTarget: 2200, proteinTarget: 160, carbsTarget: 200, fatTarget: 60 });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [foodAll, setFoodAll] = useState<FoodEntry[]>([]);

  // Per-day
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [checkin, setCheckin] = useState<Checkin | null>(null);

  // UI
  const [showSettings, setShowSettings] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [pastCamps, setPastCamps] = useState<Camp[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  // ── Initial load ────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [c, s, ex, fd, ml] = await Promise.all([
        getActiveCamp(), getSettings(), listExercises(), listFoods(), listMeals(),
      ]);
      setCamp(c); setSettings(s); setExercises(ex); setFoods(fd); setMeals(ml);
      if (c) {
        const [sess, cks, food] = await Promise.all([listSessions(c.id), listCheckins(), listFoodSince(c.startDate)]);
        setSessions(sess); setCheckins(cks); setFoodAll(food);
      }
      setBroken(false);
    } catch (e) {
      console.error("[FightCamp] load error — run migration 0015:", e);
      setBroken(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Per-day load ────────────────────────────────────────────
  useEffect(() => {
    if (!camp) return;
    let cancelled = false;
    (async () => {
      try {
        const [log, ci] = await Promise.all([listFoodLog(entryDate), getCheckin(entryDate)]);
        if (cancelled) return;
        setFoodLog(log); setCheckin(ci);
      } catch (e) {
        console.error("[FightCamp] per-day load error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [entryDate, camp]);

  // ── Derived ─────────────────────────────────────────────────
  const mmaSession = useMemo(() => sessions.find((s) => s.date === entryDate && s.kind === "mma") ?? null, [sessions, entryDate]);
  const gymSession = useMemo(() => sessions.find((s) => s.date === entryDate && s.kind === "gym") ?? null, [sessions, entryDate]);

  const weights = useMemo(
    () => checkins.filter((c) => c.weight != null).map((c) => ({ date: c.date, weight: c.weight as number })),
    [checkins]
  );
  const foodByDate = useMemo(() => {
    const m = new Map<string, { kcal: number; protein: number }>();
    for (const f of foodAll) {
      const cur = m.get(f.date) ?? { kcal: 0, protein: 0 };
      cur.kcal += f.kcal; cur.protein += f.protein;
      m.set(f.date, cur);
    }
    return m;
  }, [foodAll]);
  const weighIns = useMemo(() => new Set(checkins.filter((c) => c.weight != null).map((c) => c.date)), [checkins]);

  // ── Game layer (all derived from logged data, per the spec) ─
  const gi = useMemo<GameInput | null>(() => camp ? {
    camp, sessions, foodByDate, weighIns, weights,
    proteinTarget: settings.proteinTarget, kcalTarget: settings.kcalTarget, today,
  } : null, [camp, sessions, foodByDate, weighIns, weights, settings.proteinTarget, settings.kcalTarget, today]);

  const game = useMemo(() => gi ? computeGame(gi) : null, [gi]);
  const day = useMemo(() => gi ? daySummary(gi, entryDate) : null, [gi, entryDate]);

  const prevWeight = useMemo(() => {
    const before = weights.filter((w) => w.date < entryDate);
    return before.length ? before[before.length - 1].weight : null;
  }, [weights, entryDate]);

  const dayIndex = camp ? differenceInCalendarDays(parseISO(entryDate), parseISO(camp.startDate)) + 1 : 0;
  const currentDay = camp ? Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(camp.startDate)) + 1) : 0;

  // ── Mutations ───────────────────────────────────────────────
  const upsertSession = useCallback((saved: Session) => {
    setSessions((prev) => [...prev.filter((s) => !(s.date === saved.date && s.kind === saved.kind)), saved]);
  }, []);

  async function handleSaveSession(payload: SessionInput) {
    setBusy(true);
    try { upsertSession(await apiSaveSession(payload)); }
    catch (e) { console.error("[FightCamp] saveSession:", e); }
    finally { setBusy(false); }
  }
  async function handleDeleteSession(kind: "mma" | "gym") {
    setBusy(true);
    try {
      await apiDeleteSession(entryDate, kind);
      setSessions((prev) => prev.filter((s) => !(s.date === entryDate && s.kind === kind)));
    } catch (e) { console.error("[FightCamp] deleteSession:", e); }
    finally { setBusy(false); }
  }
  async function handleCreateExercise(name: string, muscle?: string | null) {
    const ex = await apiCreateExercise(name, muscle);
    setExercises((prev) => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)));
    return ex;
  }
  async function handleAddFood(e: Omit<FoodEntry, "id">) {
    setBusy(true);
    try {
      const row = await apiAddFoodEntry(e);
      setFoodLog((prev) => [...prev, row]);
      setFoodAll((prev) => [...prev, row]);
    } catch (err) { console.error("[FightCamp] addFood:", err); }
    finally { setBusy(false); }
  }
  async function handleDeleteFood(id: string) {
    setBusy(true);
    try {
      await apiDeleteFoodEntry(id);
      setFoodLog((prev) => prev.filter((x) => x.id !== id));
      setFoodAll((prev) => prev.filter((x) => x.id !== id));
    } catch (err) { console.error("[FightCamp] deleteFood:", err); }
    finally { setBusy(false); }
  }
  async function handleLogMeal(meal: Meal) {
    setBusy(true);
    try {
      const slot: FoodSlot = meal.slot ?? "meal";
      const added: FoodEntry[] = [];
      for (let i = 0; i < meal.items.length; i++) {
        const it = meal.items[i];
        added.push(await apiAddFoodEntry({
          date: entryDate, slot, label: it.name,
          kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat, sort: foodLog.length + i,
        }));
      }
      setFoodLog((prev) => [...prev, ...added]);
      setFoodAll((prev) => [...prev, ...added]);
    } catch (err) { console.error("[FightCamp] logMeal:", err); }
    finally { setBusy(false); }
  }
  async function handleCreateMeal(name: string, items: MealItem[], slot: FoodSlot) {
    setBusy(true);
    try { const m = await apiCreateMeal({ name, slot, items }); setMeals((prev) => [...prev, m]); }
    catch (err) { console.error("[FightCamp] createMeal:", err); }
    finally { setBusy(false); }
  }
  async function handleSaveCheckin(c: Checkin) {
    setBusy(true);
    try {
      await apiSaveCheckin(c);
      setCheckin(c);
      setCheckins((prev) => [...prev.filter((x) => x.date !== c.date), c].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) { console.error("[FightCamp] saveCheckin:", err); }
    finally { setBusy(false); }
  }
  async function handleSaveSettings(next: Settings) {
    setBusy(true);
    try { await apiSaveSettings(next); setSettings(next); }
    catch (err) { console.error("[FightCamp] saveSettings:", err); }
    finally { setBusy(false); }
  }

  // ── States ──────────────────────────────────────────────────
  if (!loaded) {
    return <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/30">Loading camp…</p>;
  }
  if (broken) {
    return (
      <p className="text-[10px] font-black tracking-[0.1em] uppercase text-[#FF6600]/80 leading-relaxed">
        Run migration <span className="text-white">0015_fight_camp.sql</span> in Supabase to start the camp.
      </p>
    );
  }
  if (!camp) {
    return <StartCamp busy={busy} today={today} onStart={async (input) => {
      setBusy(true);
      try {
        const c = await apiStartCamp(input);
        setCamp(c); setSessions([]); setCheckins([]); setFoodAll([]);
      } catch (e) { console.error("[FightCamp] startCamp:", e); setBroken(true); }
      finally { setBusy(false); }
    }} />;
  }

  // ── Main ────────────────────────────────────────────────────
  const g = game!;
  const d = day!;
  return (
    <div className="space-y-4">
      {/* Header: name + day · level + XP bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-0.5 self-stretch bg-[#E60012]" />
          <div>
            <p className="text-[12px] font-black tracking-[0.1em] uppercase text-white leading-none">{camp.name}</p>
            <p className="mt-1 text-[8px] font-black tracking-[0.14em] uppercase text-white/40">
              {camp.mode} campaign · Day {Math.min(currentDay, camp.lengthDays)} / {camp.lengthDays}
            </p>
          </div>
        </div>
        <HeaderXp level={g.level.level} into={g.level.into} need={g.level.need} pct={g.level.pct} />
      </div>

      {/* Stat strip */}
      <div className="flex flex-wrap items-stretch gap-2">
        <StatCard label="Record" accent={RED}>
          <p className="text-[18px] font-black tabular-nums leading-none">
            <span className="text-[#6BD98A]">{g.record.w}</span>
            <span className="text-white/25 mx-0.5">–</span>
            <span className="text-[#FFD600]">{g.record.d}</span>
            <span className="text-white/25 mx-0.5">–</span>
            <span className="text-[#E60012]">{g.record.l}</span>
          </p>
          <p className="mt-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">W · D · L</p>
        </StatCard>
        <StatCard label="Streak">
          <div className="flex items-center gap-1.5">
            <Flame className={cn("w-4 h-4", g.streak > 0 ? "text-[#FF6600]" : "text-white/15")} strokeWidth={2.5}
              style={g.streak > 0 ? { filter: "drop-shadow(0 0 5px rgba(255,102,0,0.6))" } : undefined} />
            <span className={cn("text-[18px] font-black tabular-nums leading-none", g.streak > 0 ? "text-white" : "text-white/25")}>{g.streak}</span>
          </div>
          <p className="mt-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">Best {g.best}</p>
        </StatCard>
        <ShieldsStat count={g.shields.count} max={g.shields.max} />
        <OvrStat ovr={g.ovrVal} delta={g.ovrDelta} />
        <BossCard boss={g.boss} />
      </div>

      {/* Selected day */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-black tracking-[0.14em] uppercase text-white/70">
              {format(parseISO(entryDate), "EEE d MMM").toUpperCase()}
            </span>
            <Micro>follows the journal calendar{dayIndex >= 1 && dayIndex <= camp.lengthDays ? ` · day ${dayIndex}` : ""}</Micro>
          </div>
          <OnTrackBadge done={d.score.done} total={d.score.total} win={d.score.win} flawless={d.flawless} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          <MmaLogger date={entryDate} campId={camp.id} session={mmaSession} busy={busy}
            onSave={handleSaveSession} onDelete={() => handleDeleteSession("mma")} />
          <GymLogger date={entryDate} campId={camp.id} session={gymSession} allSessions={sessions} exercises={exercises} busy={busy}
            onSave={handleSaveSession} onDelete={() => handleDeleteSession("gym")} onCreateExercise={handleCreateExercise} />
          <XpToday earned={d.earned} goal={d.goal} quests={d.quests} />
        </div>
      </div>

      {/* Nutrition + check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-2.5">
        <div className="border border-white/8 bg-white/[0.015] p-3.5">
          <NutritionBlock
            date={entryDate} foods={foods} meals={meals} entries={foodLog} settings={settings} busy={busy}
            onAddEntry={handleAddFood} onDeleteEntry={handleDeleteFood} onLogMeal={handleLogMeal} onCreateMeal={handleCreateMeal}
          />
        </div>
        <div className="border border-white/8 bg-white/[0.015] p-3.5">
          <Micro>Check-in</Micro>
          <div className="mt-3">
            <CheckinBlock date={entryDate} checkin={checkin} prevWeight={prevWeight} weightUnit={settings.weightUnit} busy={busy} onSave={handleSaveCheckin} />
          </div>
        </div>
      </div>

      {/* This camp: heatmap + cut chart */}
      <div className="border-t border-white/8 pt-4">
        <p className="text-[10px] font-black tracking-[0.16em] uppercase text-white/55 mb-3">This Camp</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <div className="border border-white/8 bg-white/[0.015] p-3.5">
            <CampHeatmap camp={camp} sessions={sessions} today={today} viewedDate={entryDate} />
          </div>
          <CutChart camp={camp} weights={weights}
            trendWeight={g.trendWeight} progressPct={g.progressPct} onPace={g.onPace} />
        </div>
      </div>

      {/* Fighter card + technique cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <FighterCard name="FIGHTER" level={g.level.level} ovr={g.ovrVal} attrs={g.attrs} note={g.note} />
        <TechniqueCards cards={g.tech.cards} conquered={g.tech.conquered} />
      </div>

      {/* Achievements */}
      <div className="border-t border-white/8 pt-3">
        <Achievements list={g.ach.list} earned={g.ach.earned} />
      </div>

      {/* Footer */}
      <div className="border-t border-white/8 pt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[8px] font-black tracking-[0.12em] uppercase text-white/25">
            Started {format(parseISO(camp.startDate), "d MMM yyyy")} · ends {format(addDays(parseISO(camp.startDate), camp.lengthDays - 1), "d MMM yyyy")}
            {camp.fightDate ? ` · fight ${format(parseISO(camp.fightDate), "d MMM")}` : ""}
          </span>
          <div className="flex items-center gap-3">
            <FooterBtn onClick={() => setShowSettings((v) => !v)}><Settings2 className="w-3 h-3" /> Targets</FooterBtn>
            <FooterBtn onClick={async () => { setShowPast((v) => !v); if (!pastCamps.length) setPastCamps(await listCamps()); }}>
              <ChevronDown className={cn("w-3 h-3 transition-transform", showPast && "rotate-180")} /> Past camps
            </FooterBtn>
            {confirmReset ? (
              <span className="flex items-center gap-2">
                <span className="text-[8px] font-black tracking-[0.12em] uppercase text-[#E60012]">End this camp?</span>
                <button onClick={async () => { setBusy(true); await updateCamp(camp.id, { status: "done" }); setConfirmReset(false); await loadAll(); setBusy(false); }} className="px-2 py-1 bg-[#E60012] text-white text-[8px] font-black tracking-[0.12em] uppercase cursor-pointer">Yes</button>
                <button onClick={() => setConfirmReset(false)} className="px-2 py-1 border border-white/12 text-white/50 text-[8px] font-black tracking-[0.12em] uppercase cursor-pointer">No</button>
              </span>
            ) : (
              <FooterBtn onClick={() => setConfirmReset(true)}><RotateCcw className="w-3 h-3" /> End camp</FooterBtn>
            )}
          </div>
        </div>

        {/* Targets editor */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <TargetsEditor settings={settings} busy={busy} onSave={handleSaveSettings} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past camps */}
        <AnimatePresence>
          {showPast && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-1.5 pt-1">
                {pastCamps.filter((c) => c.status === "done").length === 0 && (
                  <p className="text-[9px] font-bold tracking-[0.06em] uppercase text-white/25">No past camps yet.</p>
                )}
                {pastCamps.filter((c) => c.status === "done").map((c) => (
                  <div key={c.id} className="flex items-center justify-between border border-white/8 px-2.5 py-1.5">
                    <span className="text-[10px] font-black tracking-[0.06em] uppercase text-white/70">{c.name}</span>
                    <span className="text-[8px] font-black tracking-[0.1em] uppercase text-white/30">
                      {format(parseISO(c.startDate), "d MMM yyyy")} · {c.lengthDays}d · {c.mode}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Start a new camp ─────────────────────────────────────────
function StartCamp({ busy, today, onStart }: {
  busy: boolean; today: string;
  onStart: (input: { name: string; startDate: string; lengthDays: number; mode: CampMode; fightDate?: string | null; weightStart?: number | null; weightTarget?: number | null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Cut Campaign");
  const [length, setLength] = useState(30);
  const [mode, setMode] = useState<CampMode>("cut");
  const [startDate, setStartDate] = useState(today);
  const [fightDate, setFightDate] = useState("");
  const [wStart, setWStart] = useState("");
  const [wTarget, setWTarget] = useState("");

  if (!open) {
    return (
      <div className="text-center py-6">
        <Swords className="w-7 h-7 mx-auto text-[#E60012] mb-3" strokeWidth={2.5} />
        <p className="text-[13px] font-black tracking-[0.14em] uppercase text-white">Start a Fight Camp</p>
        <p className="mt-2 text-[10px] font-bold tracking-[0.06em] uppercase text-white/40 leading-relaxed max-w-[360px] mx-auto">
          Set a length and a mode. Log MMA and gym sessions, fuel and body weight — everything rolls up into this camp.
        </p>
        <PrimaryBtn onClick={() => setOpen(true)} className="mt-4 px-5 py-2.5 text-[10px] tracking-[0.16em]">Step Into The Cage</PrimaryBtn>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      {/* Camp name — full width */}
      <div>
        <Micro>Camp name</Micro>
        <Field value={name} onChange={setName} className="mt-1 w-full" />
      </div>

      {/* Everything else in one aligned grid so labels + inputs line up */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        <div className="flex flex-col">
          <Micro>Length (days)</Micro>
          <Field type="number" value={String(length)} onChange={(v) => setLength(Math.max(1, Math.round(Number(v) || 30)))} className="mt-1 w-full" />
        </div>
        <div className="flex flex-col">
          <Micro>Mode</Micro>
          <div className="mt-1 flex">
            {(["cut", "maintain"] as CampMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={cn("flex-1 px-3 py-1.5 text-[9px] font-black tracking-[0.1em] uppercase border border-white/12 -ml-px first:ml-0 transition-all cursor-pointer",
                  mode === m ? "bg-[#E60012]/15 border-[#E60012] text-white" : "text-white/40 hover:text-white/70")}>{m}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <Micro>Start</Micro>
          <Field type="date" value={startDate} onChange={setStartDate} className="mt-1 w-full" />
        </div>
        <div className="flex flex-col">
          <Micro>Fight date (opt)</Micro>
          <Field type="date" value={fightDate} onChange={setFightDate} className="mt-1 w-full" />
        </div>
        <div className="flex flex-col">
          <Micro>Weight now (opt)</Micro>
          <Field type="number" value={wStart} onChange={setWStart} placeholder="kg" className="mt-1 w-full" />
        </div>
        <div className="flex flex-col">
          <Micro>Target (opt)</Micro>
          <Field type="number" value={wTarget} onChange={setWTarget} placeholder="kg" className="mt-1 w-full" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <PrimaryBtn
          disabled={busy || !name.trim()}
          onClick={() => onStart({
            name: name.trim(), startDate, lengthDays: length, mode,
            fightDate: fightDate || null,
            weightStart: wStart ? Number(wStart) : null,
            weightTarget: wTarget ? Number(wTarget) : null,
          })}
        >Begin Camp</PrimaryBtn>
        <button onClick={() => setOpen(false)} className="px-3 py-2 border border-white/12 text-white/50 text-[9px] font-black tracking-[0.12em] uppercase cursor-pointer">Cancel</button>
      </div>
    </div>
  );
}

// ─── Targets editor ───────────────────────────────────────────
function TargetsEditor({ settings, busy, onSave }: { settings: Settings; busy: boolean; onSave: (s: Settings) => Promise<void> }) {
  const [kcal, setKcal] = useState(String(settings.kcalTarget));
  const [protein, setProtein] = useState(String(settings.proteinTarget));
  const [carbs, setCarbs] = useState(String(settings.carbsTarget));
  const [fat, setFat] = useState(String(settings.fatTarget));
  const [unit, setUnit] = useState(settings.weightUnit);
  return (
    <div className="flex flex-wrap items-end gap-3 pt-1">
      <TargetField label="Kcal" value={kcal} onChange={setKcal} />
      <TargetField label="Protein g" value={protein} onChange={setProtein} />
      <TargetField label="Carbs g" value={carbs} onChange={setCarbs} />
      <TargetField label="Fat g" value={fat} onChange={setFat} />
      <div>
        <Micro>Unit</Micro>
        <div className="mt-1 flex">
          {["kg", "lb"].map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)}
              className={cn("px-2.5 py-1.5 text-[9px] font-black uppercase border border-white/12 -ml-px first:ml-0 cursor-pointer", unit === u ? "bg-white/10 text-white" : "text-white/40")}>{u}</button>
          ))}
        </div>
      </div>
      <PrimaryBtn disabled={busy} onClick={() => onSave({
        weightUnit: unit, kcalTarget: Number(kcal) || 0, proteinTarget: Number(protein) || 0,
        carbsTarget: Number(carbs) || 0, fatTarget: Number(fat) || 0,
      })}>Save Targets</PrimaryBtn>
    </div>
  );
}

function TargetField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Micro>{label}</Micro>
      <Field type="number" value={value} onChange={onChange} className="mt-1 w-20 text-center" />
    </div>
  );
}

function FooterBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.12em] uppercase text-white/25 hover:text-white/60 transition-colors cursor-pointer">
      {children}
    </button>
  );
}
