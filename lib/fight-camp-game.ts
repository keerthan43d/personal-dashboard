/**
 * Fight Camp — game layer (pure, no DB).
 *
 * This is a faithful implementation of docs/fight-camp "game math" spec.
 * EVERYTHING here is DERIVED from what the user already logs (sessions /
 * food / check-ins) — no extra tables. All tunables live in the KNOBS block.
 *
 * Simplifying assumptions where the data model can't carry a spec concept:
 *  • Rest days aren't a field yet, so a "rest day" never counts as trained and
 *    never contributes to flawless. (A day with no qualifying session = loss.)
 *  • Weigh-in time isn't captured, so the "before 12:00" morning rule is
 *    relaxed to "a weight was logged that day".
 *  • A missing duration is treated as meeting the minimum (unknown ≠ tiny).
 *  • PRs come from the `isPR` flag the gym logger already computes (e1RM rule).
 */
import { startOfWeek, endOfWeek, differenceInCalendarDays, parseISO, format, addDays } from "date-fns";
import type { Session } from "@/lib/db/fight-camp-repository";

// ─── Tunable knobs (spec §1, §2, §6) ──────────────────────────
const XP = {
  mma: 100, perRound: 10, roundsCap: 12,
  gym: 75, perPR: 60, prCap: 3,
  protein: 50, calories: 50, weighIn: 20,
  perLearning: 15, learningCap: 3,
  quest: 40, flawless: 150, bossDefeat: 500,
  twoADayMult: 1.5,
};
const MIN_MMA_MIN = 30;
const MIN_GYM_MIN = 20;
const PROTEIN_HIT = 0.95;          // × target
const CAL_LOW = 0.85, CAL_HIGH = 1.05;
const EFFORT_FLAWLESS = 6;

const BOSS_HP_WEEK1 = 2000;
const BOSS_HP_MIN = 1500, BOSS_HP_MAX = 3500;
const BOSS = {
  mma: 120, perRound: 5, gym: 100, won: 80, flawless: 60, pr: 100, quest: 20,
};
const BOSSES = [
  "The Iron Ox", "Cage Rat", "The Grinder", "Red Hand",
  "Night Wolf", "The Wall", "Gravedigger", "Old Stone",
];

const ATTR_TARGET = { striking: 700, grappling: 450, strength: 150, conditioning: 1400 };

// ─── Focus classification ─────────────────────────────────────
const STRIKE_KW = ["strik", "spar", "box", "muay", "kick", "stand", "thai"];
const GRAPPLE_KW = ["wrestl", "bjj", "grappl", "jiu", "jits", "ground", "clinch", "takedown", "roll"];
const isStrike = (f: string) => STRIKE_KW.some((k) => f.includes(k));
const isGrapple = (f: string) => GRAPPLE_KW.some((k) => f.includes(k));

// ─── Public types ─────────────────────────────────────────────
export type Attributes = { striking: number; grappling: number; strength: number; conditioning: number; discipline: number };
export type Boss = { name: string; totalHp: number; hpLeft: number; daysLeft: number; defeated: boolean };
export type Quest = { label: string; done: boolean; xp: number };
export type TechCard = { text: string; type: "mistake" | "fix" | "technique"; count: number; progress?: number; done: boolean };
export type Achievement = { key: string; label: string; earned: boolean; progress?: string; xp: number };
export type DayResult = "win" | "draw" | "loss";

export type GameInput = {
  camp: { startDate: string; lengthDays: number; mode: "cut" | "maintain"; weightStart: number | null; weightTarget: number | null };
  sessions: Session[];
  foodByDate: Map<string, { kcal: number; protein: number }>;
  weighIns: Set<string>;
  weights: { date: string; weight: number }[];
  proteinTarget: number;
  kcalTarget: number;
  today: string;
};

// ─── Small helpers ────────────────────────────────────────────
const round = (n: number) => Math.round(n);
const clampStat = (n: number) => Math.max(40, Math.min(99, Math.round(n)));
const roundNice = (v: number, step: number) => Math.round(v / step) * step;
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function datesInclusive(start: string, end: string): string[] {
  const out: string[] = [];
  let d = parseISO(start);
  const e = parseISO(end);
  while (d <= e) { out.push(format(d, "yyyy-MM-dd")); d = addDays(d, 1); }
  return out;
}
const dur = (s: Session) => s.durationMin ?? (s.kind === "mma" ? MIN_MMA_MIN : MIN_GYM_MIN);
const effortOf = (s: Session) => s.effort ?? EFFORT_FLAWLESS;
const roundsOf = (s: Session) => s.sparRounds.length;
const prsOf = (s: Session) => s.gymEntries.reduce((n, e) => n + e.sets.filter((x) => x.isPR).length, 0);
const mmaOk = (s: Session | null) => !!s && dur(s) >= MIN_MMA_MIN;
const gymOk = (s: Session | null) => !!s && dur(s) >= MIN_GYM_MIN;

// ─── Per-day log ──────────────────────────────────────────────
type DayLog = {
  date: string;
  mma: Session | null; gym: Session | null;
  rounds: number; prs: number; learnings: number; effortMax: number;
  kcal: number; protein: number; weighIn: boolean;
  trainedOk: boolean; nutritionOk: boolean; result: DayResult; flawless: boolean;
};

/** Build the derived day-log map once; everything else reads from it. */
function buildLogs(input: GameInput): Map<string, DayLog> {
  const { sessions, foodByDate, weighIns, proteinTarget, kcalTarget } = input;
  const byDate = new Map<string, { mma: Session | null; gym: Session | null }>();
  for (const s of sessions) {
    const cur = byDate.get(s.date) ?? { mma: null, gym: null };
    if (s.kind === "mma") cur.mma = s; else cur.gym = s;
    byDate.set(s.date, cur);
  }
  const dates = new Set<string>([...byDate.keys(), ...foodByDate.keys(), ...weighIns]);
  const logs = new Map<string, DayLog>();
  for (const date of dates) {
    const { mma = null, gym = null } = byDate.get(date) ?? {};
    const food = foodByDate.get(date) ?? { kcal: 0, protein: 0 };
    const weighIn = weighIns.has(date);
    const rounds = mma ? roundsOf(mma) : 0;
    const prs = gym ? prsOf(gym) : 0;
    const learnings = mma ? mma.learnings.length : 0;
    const effortMax = mma ? effortOf(mma) : 0;
    const trainedOk = mmaOk(mma) || gymOk(gym);
    const proteinHit = proteinTarget > 0 && food.protein >= PROTEIN_HIT * proteinTarget;
    const calOk = kcalTarget > 0 && food.kcal >= CAL_LOW * kcalTarget && food.kcal <= CAL_HIGH * kcalTarget;
    const nutritionOk = proteinHit && calOk;
    const result: DayResult = trainedOk && nutritionOk ? "win" : trainedOk || nutritionOk ? "draw" : "loss";
    const flawless = result === "win" && weighIn && effortMax >= EFFORT_FLAWLESS;
    logs.set(date, { date, mma, gym, rounds, prs, learnings, effortMax, kcal: food.kcal, protein: food.protein, weighIn, trainedOk, nutritionOk, result, flawless });
  }
  return logs;
}
const EMPTY_LOG: Omit<DayLog, "date"> = {
  mma: null, gym: null, rounds: 0, prs: 0, learnings: 0, effortMax: 0,
  kcal: 0, protein: 0, weighIn: false, trainedOk: false, nutritionOk: false, result: "loss", flawless: false,
};

// ─── Daily quests (spec §7) ───────────────────────────────────
function questsForDay(date: string, logs: Map<string, DayLog>, allDates: string[], pTarget: number): Quest[] {
  const l = logs.get(date) ?? { date, ...EMPTY_LOG };
  const start = format(addDays(parseISO(date), -14), "yyyy-MM-dd");
  const prior = allDates.filter((d) => d >= start && d < date).map((d) => logs.get(d)!).filter(Boolean);
  const medRounds = median(prior.filter((p) => p.mma).map((p) => p.rounds));
  const medProtein = median(prior.filter((p) => p.protein > 0).map((p) => p.protein));

  // Training (from spar history, else just "train").
  const training: Quest = medRounds >= 1
    ? { label: `Spar ${Math.max(2, roundNice(1.1 * medRounds, 1))}+ rounds`, done: l.rounds >= Math.max(2, roundNice(1.1 * medRounds, 1)), xp: XP.quest }
    : { label: "Log a training session", done: l.trainedOk, xp: XP.quest };

  // Nutrition — hit a protein number (target, or a nudge above your median).
  const pGoal = pTarget > 0 ? pTarget : roundNice(1.1 * (medProtein || 120), 5);
  const nutrition: Quest = { label: `Hit ${Math.round(pGoal)} g protein`, done: pGoal > 0 && l.protein >= PROTEIN_HIT * pGoal, xp: XP.quest };

  // Stretch (harder) — a two-a-day.
  const stretch: Quest = { label: "Two-a-day · MMA + gym", done: mmaOk(l.mma) && gymOk(l.gym), xp: XP.quest };

  return [training, nutrition, stretch];
}

// ─── XP + damage per day ──────────────────────────────────────
function dayBaseXp(l: DayLog, questsDone: number): number {
  let base = 0;
  if (mmaOk(l.mma)) base += XP.mma + Math.min(XP.roundsCap, l.rounds) * XP.perRound;
  if (gymOk(l.gym)) base += XP.gym;
  base += Math.min(XP.prCap, l.prs) * XP.perPR;
  // protein / calorie bonuses are scored independently (spec §1)
  if (proteinHitBonus(l)) base += XP.protein;
  if (calBonusApplies(l)) base += XP.calories;
  if (l.weighIn) base += XP.weighIn;
  base += Math.min(XP.learningCap, l.learnings) * XP.perLearning;
  base += questsDone * XP.quest;
  if (l.flawless) base += XP.flawless;
  if (mmaOk(l.mma) && gymOk(l.gym)) base = round(base * XP.twoADayMult);
  return base;
}
// protein/cal bonus need the targets; captured via closures in computeGame.
let proteinHitBonus: (l: DayLog) => boolean = () => false;
let calBonusApplies: (l: DayLog) => boolean = () => false;

function dayDamage(l: DayLog, questsDone: number): number {
  let session = 0;
  if (mmaOk(l.mma)) session += BOSS.mma + Math.min(XP.roundsCap, l.rounds) * BOSS.perRound;
  if (gymOk(l.gym)) session += BOSS.gym;
  if (mmaOk(l.mma) && gymOk(l.gym)) session = round(session * XP.twoADayMult);
  let d = session;
  if (l.result === "win") d += BOSS.won;
  if (l.flawless) d += BOSS.flawless;
  d += Math.min(XP.prCap, l.prs) * BOSS.pr;
  d += questsDone * BOSS.quest;
  return d;
}

// ─── Levels (spec §2) ─────────────────────────────────────────
function xpToNext(level: number): number { return 200 + 400 * level; }
export function levelFromXp(xp: number): { level: number; into: number; need: number; pct: number } {
  let level = 1, rem = xp;
  while (rem >= xpToNext(level)) { rem -= xpToNext(level); level++; }
  const need = xpToNext(level);
  return { level, into: round(rem), need, pct: Math.min(100, Math.round((rem / need) * 100)) };
}

// ─── Fighter attributes (spec §5) ─────────────────────────────
function attributesAsOf(logs: Map<string, DayLog>, asOf: string): Attributes {
  const from = format(addDays(parseISO(asOf), -27), "yyyy-MM-dd");
  let striking = 0, grappling = 0, strength = 0, conditioning = 0;
  let gymSessions = 0, prs = 0, twoADays = 0;
  let wins = 0, draws = 0, settled = 0, weighIns = 0;
  for (const [date, l] of logs) {
    if (date < from || date > asOf) continue;
    settled++;
    if (l.result === "win") wins++; else if (l.result === "draw") draws++;
    if (l.weighIn) weighIns++;
    if (mmaOk(l.mma) && gymOk(l.gym)) twoADays++;
    if (l.mma) {
      const f = (l.mma.focus ?? "").toLowerCase();
      const load = dur(l.mma) * effortOf(l.mma) / 10;
      if (isStrike(f)) { striking += load; }
      if (isGrapple(f)) { grappling += load; }
      striking += 6 * l.rounds;                        // sparring rounds feed striking
      conditioning += load;
    }
    if (l.gym) {
      gymSessions++; prs += l.prs;
      conditioning += dur(l.gym) * effortOf(l.gym) / 10;
    }
  }
  conditioning += 30 * twoADays;
  strength = 10 * gymSessions + 15 * prs;
  const winRate = settled ? (wins + 0.5 * draws) / settled : 0;
  const weighRate = settled ? weighIns / settled : 0;
  return {
    striking: clampStat(40 + 59 * Math.min(1, striking / ATTR_TARGET.striking)),
    grappling: clampStat(40 + 59 * Math.min(1, grappling / ATTR_TARGET.grappling)),
    strength: clampStat(40 + 59 * Math.min(1, strength / ATTR_TARGET.strength)),
    conditioning: clampStat(40 + 59 * Math.min(1, conditioning / ATTR_TARGET.conditioning)),
    discipline: clampStat(40 + 59 * (0.7 * winRate + 0.3 * weighRate)),
  };
}
export function ovr(a: Attributes): number {
  return Math.round(0.25 * a.striking + 0.20 * a.grappling + 0.15 * a.strength + 0.20 * a.conditioning + 0.20 * a.discipline);
}

/** Last date an MMA session matched a focus class (for the "dropping" nudge). */
function lastFocusDate(logs: Map<string, DayLog>, match: (f: string) => boolean, asOf: string): string | null {
  let best: string | null = null;
  for (const [date, l] of logs) {
    if (date > asOf || !l.mma) continue;
    if (match((l.mma.focus ?? "").toLowerCase()) && (!best || date > best)) best = date;
  }
  return best;
}

// ─── Weekly boss (spec §6) ────────────────────────────────────
type Week = { start: string; dmg: number; hp: number; defeated: boolean; name: string; index: number };
function buildWeeks(logs: Map<string, DayLog>, questsDone: (d: string) => number, input: GameInput): Week[] {
  const campStart = input.camp.startDate;
  const campEnd = format(addDays(parseISO(campStart), input.camp.lengthDays - 1), "yyyy-MM-dd");
  const settleEnd = input.today < campEnd ? input.today : campEnd;
  const firstWeek = format(startOfWeek(parseISO(campStart), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const lastWeek = format(startOfWeek(parseISO(settleEnd), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weeks: Week[] = [];
  let ws = firstWeek, index = 0;
  while (ws <= lastWeek) {
    const we = format(endOfWeek(parseISO(ws), { weekStartsOn: 1 }), "yyyy-MM-dd");
    let dmg = 0;
    for (const [date, l] of logs) if (date >= ws && date <= we && date >= campStart) dmg += dayDamage(l, questsDone(date));
    const hp = index === 0
      ? BOSS_HP_WEEK1
      : Math.max(BOSS_HP_MIN, Math.min(BOSS_HP_MAX, round(1.1 * (() => {
          const prev = weeks.slice(-3).map((w) => w.dmg);
          return prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : BOSS_HP_WEEK1;
        })())));
    weeks.push({ start: ws, dmg, hp, defeated: dmg >= hp, name: BOSSES[index % BOSSES.length], index });
    ws = format(addDays(parseISO(ws), 7), "yyyy-MM-dd");
    index++;
  }
  return weeks;
}

// ─── Technique cards (spec §9) ────────────────────────────────
const keyOf = (text: string, tags?: string[]) => (tags && tags[0] ? tags[0] : text).trim().toLowerCase();
export function techniqueCards(sessions: Session[]): { cards: TechCard[]; conquered: number } {
  type St = { text: string; type: "mistake" | "fix" | "technique"; count: number; status: "open" | "fixing" | "done"; clean: number };
  const map = new Map<string, St>();
  const mma = sessions.filter((s) => s.kind === "mma").sort((a, b) => a.date.localeCompare(b.date));
  for (const s of mma) {
    const mistakes = new Set<string>(), fixes = new Set<string>();
    for (const l of s.learnings) {
      const key = keyOf(l.text, l.tags);
      if (!key) continue;
      const st = map.get(key) ?? { text: l.text.trim(), type: l.type, count: 0, status: "open" as const, clean: 0 };
      st.text = l.text.trim(); st.type = l.type;
      map.set(key, st);
      if (l.type === "mistake") mistakes.add(key);
      else if (l.type === "fix") fixes.add(key);
      else { if (!mistakes.has(key) && st.status === "open" && st.count === 0) st.type = "technique"; }
    }
    // Apply mistakes (reopen), then fixes (start fixing), then advance clean runs.
    for (const key of mistakes) { const st = map.get(key)!; st.count++; st.status = "open"; st.clean = 0; }
    for (const key of fixes) { const st = map.get(key)!; if (st.status !== "done") { st.status = "fixing"; st.clean = 0; } }
    for (const [key, st] of map) {
      if (st.status === "fixing" && !mistakes.has(key) && !fixes.has(key)) {
        st.clean++;
        if (st.clean >= 3) st.status = "done";
      }
    }
  }
  const cards: TechCard[] = [];
  let conquered = 0;
  for (const st of map.values()) {
    const done = st.status === "done";
    if (done) conquered++;
    const cap = st.text.charAt(0).toUpperCase() + st.text.slice(1);
    if (st.status === "fixing" || done) cards.push({ text: cap, type: "fix", count: st.count, progress: Math.min(st.clean, 3), done });
    else cards.push({ text: cap, type: st.type, count: st.count, done: false });
  }
  cards.sort((a, b) => Number(a.done) - Number(b.done) || b.count - a.count);
  return { cards, conquered };
}

// ─── Main engine ──────────────────────────────────────────────
export type Game = {
  xpTotal: number;
  level: { level: number; into: number; need: number; pct: number };
  attrs: Attributes; ovrVal: number; ovrDelta: number; note: string | null;
  boss: Boss; bossTrophies: string[];
  record: { w: number; d: number; l: number };
  streak: number; best: number;
  shields: { count: number; max: number };
  tech: { cards: TechCard[]; conquered: number };
  ach: { list: Achievement[]; earned: number };
  trendWeight: number | null; progressPct: number | null; onPace: boolean | null;
};

export function computeGame(input: GameInput): Game {
  const { camp, sessions, proteinTarget, kcalTarget, today, weights } = input;
  const logs = buildLogs(input);

  // Wire the target-dependent bonus closures used by dayBaseXp.
  proteinHitBonus = (l) => proteinTarget > 0 && l.protein >= PROTEIN_HIT * proteinTarget;
  calBonusApplies = (l) => kcalTarget > 0 && l.kcal >= CAL_LOW * kcalTarget && l.kcal <= CAL_HIGH * kcalTarget;

  const campEnd = format(addDays(parseISO(camp.startDate), camp.lengthDays - 1), "yyyy-MM-dd");
  const settleEnd = today < campEnd ? today : campEnd;
  const settledDates = datesInclusive(camp.startDate, settleEnd);
  const allDates = [...logs.keys()].sort();

  const questDoneByDate = new Map<string, number>();
  const questsDone = (d: string) => {
    if (questDoneByDate.has(d)) return questDoneByDate.get(d)!;
    const n = questsForDay(d, logs, allDates, proteinTarget).filter((q) => q.done).length;
    questDoneByDate.set(d, n);
    return n;
  };

  // Record + protein/flawless runs (shield-independent).
  let wins = 0, draws = 0, losses = 0;
  let proteinRun = 0, proteinRunBest = 0, flawlessRun = 0, flawlessRunBest = 0;
  for (const date of settledDates) {
    const l = logs.get(date);
    const r: DayResult = l ? l.result : "loss";
    if (l && proteinHitBonus(l)) { proteinRun++; proteinRunBest = Math.max(proteinRunBest, proteinRun); } else proteinRun = 0;
    if (l && l.flawless) { flawlessRun++; flawlessRunBest = Math.max(flawlessRunBest, flawlessRun); } else flawlessRun = 0;
    if (r === "win") wins++; else if (r === "draw") draws++; else losses++;
  }
  // XP total (days + boss defeats + achievements) — computed after we know quests.
  let xpDays = 0;
  for (const date of settledDates) { const l = logs.get(date); if (l) xpDays += dayBaseXp(l, questsDone(date)); }

  const weeks = buildWeeks(logs, questsDone, input);
  const bossesDefeated = weeks.filter((w) => w.defeated).length;
  const bossTrophies = weeks.filter((w) => w.defeated).map((w) => w.name);
  // longest consecutive run of defeated weeks
  let bossRun = 0, bossRunBest = 0;
  for (const w of weeks) { if (w.defeated) { bossRun++; bossRunBest = Math.max(bossRunBest, bossRun); } else bossRun = 0; }

  // Shields: 1 per 7 wins, consumed by losses, held cap by level (resolved iteratively).
  // Re-replay with shield consumption now that `wins` is known for cap/level.
  const xpForLevel = xpDays + bossesDefeated * XP.bossDefeat;
  const levelNow = levelFromXp(xpForLevel).level;
  const shieldCap = levelNow >= 12 ? 3 : 2;
  // Replay with shield consumption → current streak, best streak, shields held.
  let streak = 0, best = 0, used = 0, w = 0;
  for (const date of settledDates) {
    const r = (logs.get(date)?.result) ?? "loss";
    if (r === "win") { streak++; w++; }
    else if (r === "loss") {
      const earned = Math.floor(w / 7);
      if (earned - used > 0) used++;        // absorb with a shield, streak survives
      else streak = 0;
    }
    best = Math.max(best, streak);
  }
  const shieldsHeld = Math.max(0, Math.min(shieldCap, Math.floor(wins / 7) - used));

  // Attributes + OVR + weekly delta.
  const attrs = attributesAsOf(logs, today);
  const ovrVal = ovr(attrs);
  const prior = format(addDays(parseISO(today), -7), "yyyy-MM-dd");
  const ovrDelta = ovrVal - ovr(attributesAsOf(logs, prior));

  // "Dropping" nudge — weakest attribute neglected 7+ days.
  let note: string | null = null;
  const weakest = (Object.entries(attrs) as [keyof Attributes, number][]).sort((a, b) => a[1] - b[1])[0][0];
  if (weakest === "grappling") {
    const last = lastFocusDate(logs, isGrapple, today);
    if (!last) note = "Grappling untouched · no wrestling/BJJ logged yet";
    else { const days = differenceInCalendarDays(parseISO(today), parseISO(last)); if (days >= 7) note = `Grappling dropping · ${days} days without wrestling/BJJ`; }
  } else if (weakest === "striking") {
    const last = lastFocusDate(logs, isStrike, today);
    if (last) { const days = differenceInCalendarDays(parseISO(today), parseISO(last)); if (days >= 7) note = `Striking dropping · ${days} days without striking/sparring`; }
  }

  // Current boss (the week containing today).
  const todayWeekStart = format(startOfWeek(parseISO(today), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const curWeek = weeks.find((w) => w.start === todayWeekStart) ?? weeks[weeks.length - 1];
  const weekEnd = curWeek ? endOfWeek(parseISO(curWeek.start), { weekStartsOn: 1 }) : parseISO(today);
  const boss: Boss = curWeek
    ? { name: curWeek.name, totalHp: curWeek.hp, hpLeft: Math.max(0, curWeek.hp - curWeek.dmg), daysLeft: Math.max(0, differenceInCalendarDays(weekEnd, parseISO(today))), defeated: curWeek.defeated }
    : { name: BOSSES[0], totalHp: BOSS_HP_WEEK1, hpLeft: BOSS_HP_WEEK1, daysLeft: 0, defeated: false };

  // Max sparring rounds in any single week (Cardio Machine).
  let maxRoundsWeek = 0;
  { const byWeek = new Map<string, number>();
    for (const [date, l] of logs) { const wk = format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), "yyyy-MM-dd"); byWeek.set(wk, (byWeek.get(wk) ?? 0) + l.rounds); }
    for (const v of byWeek.values()) maxRoundsWeek = Math.max(maxRoundsWeek, v);
  }
  const twoADayTotal = [...logs.values()].filter((l) => mmaOk(l.mma) && gymOk(l.gym)).length;
  const prTotal = [...logs.values()].reduce((n, l) => n + l.prs, 0);
  const tech = techniqueCards(sessions);

  // Weight trend (spec §8).
  const wSorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const trendWeight = wSorted.length ? round10(avg(wSorted.slice(-7).map((w) => w.weight))) : null;
  const wStart = camp.weightStart ?? (wSorted.length ? wSorted[0].weight : null);
  const wTarget = camp.weightTarget;
  let progressPct: number | null = null, onPace: boolean | null = null;
  if (wStart != null && wTarget != null && trendWeight != null && wStart !== wTarget) {
    progressPct = Math.max(0, Math.min(100, Math.round(((wStart - trendWeight) / (wStart - wTarget)) * 100)));
    const elapsed = Math.min(camp.lengthDays, Math.max(1, differenceInCalendarDays(parseISO(settleEnd), parseISO(camp.startDate)) + 1));
    const plannedToday = wStart + (wTarget - wStart) * (elapsed / camp.lengthDays);
    onPace = trendWeight <= plannedToday + 0.3;
  }
  const cutComplete = camp.mode === "cut" && wTarget != null && trendWeight != null && trendWeight <= wTarget;

  // Achievements (spec §10).
  const list: Achievement[] = [
    { key: "first-blood", label: "First Blood", earned: wins >= 1, xp: 100 },
    { key: "iron-gut", label: "Iron Gut", earned: proteinRunBest >= 7, progress: `${Math.min(proteinRunBest, 7)}/7`, xp: 150 },
    { key: "two-a-day", label: "Two-a-Day Warrior", earned: twoADayTotal >= 10, progress: `${Math.min(twoADayTotal, 10)}/10`, xp: 200 },
    { key: "cardio", label: "Cardio Machine", earned: maxRoundsWeek >= 30, progress: `${Math.min(maxRoundsWeek, 30)}/30`, xp: 200 },
    { key: "pr-hunter", label: "PR Hunter", earned: prTotal >= 5, progress: `${Math.min(prTotal, 5)}/5`, xp: 150 },
    { key: "boss-slayer", label: "Boss Slayer", earned: bossRunBest >= 4, progress: `${Math.min(bossRunBest, 4)}/4`, xp: 300 },
    { key: "flawless-week", label: "Flawless Week", earned: flawlessRunBest >= 7, progress: `${Math.min(flawlessRunBest, 7)}/7`, xp: 300 },
    { key: "cut-complete", label: "Cut Complete", earned: cutComplete, xp: 300 },
    { key: "unbreakable", label: "Unbreakable", earned: best >= 21, progress: `${Math.min(best, 21)}/21`, xp: 300 },
    { key: "student", label: "Student of the Game", earned: tech.conquered >= 5, progress: `${Math.min(tech.conquered, 5)}/5`, xp: 200 },
  ];
  const achXp = list.filter((a) => a.earned).reduce((n, a) => n + a.xp, 0);
  const xpTotal = xpDays + bossesDefeated * XP.bossDefeat + achXp;

  return {
    xpTotal,
    level: levelFromXp(xpTotal),
    attrs, ovrVal, ovrDelta, note,
    boss, bossTrophies,
    record: { w: wins, d: draws, l: losses },
    streak, best,
    shields: { count: shieldsHeld, max: shieldCap },
    tech,
    ach: { list, earned: list.filter((a) => a.earned).length },
    trendWeight, progressPct, onPace,
  };
}

// ─── Selected-day summary (for the XP-Today column + on-track badge) ──
export type DaySummary = {
  earned: number; goal: number; quests: Quest[];
  result: DayResult; flawless: boolean;
  score: { done: number; total: number; win: boolean };
};
export function daySummary(input: GameInput, date: string): DaySummary {
  const logs = buildLogs(input);
  proteinHitBonus = (l) => input.proteinTarget > 0 && l.protein >= PROTEIN_HIT * input.proteinTarget;
  calBonusApplies = (l) => input.kcalTarget > 0 && l.kcal >= CAL_LOW * input.kcalTarget && l.kcal <= CAL_HIGH * input.kcalTarget;
  const allDates = [...logs.keys()].sort();
  const quests = questsForDay(date, logs, allDates, input.proteinTarget);
  const l = logs.get(date) ?? { date, ...EMPTY_LOG };
  const earned = dayBaseXp(l, quests.filter((q) => q.done).length);
  const done = (l.trainedOk ? 1 : 0) + (l.nutritionOk ? 1 : 0) + (l.weighIn ? 1 : 0);
  return { earned, goal: DAY_GOAL, quests, result: l.result, flawless: l.flawless, score: { done, total: 3, win: l.result === "win" } };
}

// A strong "flawless two-a-day" reference target for the XP-Today denominator.
export const DAY_GOAL = round(
  (XP.mma + 5 * XP.perRound + XP.gym + 1 * XP.perPR + XP.protein + XP.calories + XP.weighIn + 2 * XP.perLearning + 3 * XP.quest + XP.flawless) * XP.twoADayMult
);

// ─── tiny math ────────────────────────────────────────────────
function avg(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function round10(n: number): number { return Math.round(n * 10) / 10; }
