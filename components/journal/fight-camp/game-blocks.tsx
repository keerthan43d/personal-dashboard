"use client";
import { Shield, Check, Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Micro, StatCard, GREEN, AMBER, COPPER, RED } from "./shared";
import type { Attributes, Quest, Boss, TechCard, Achievement } from "@/lib/fight-camp-game";

// ─── Header: level + XP bar ───────────────────────────────────
export function HeaderXp({ level, into, need, pct }: { level: number; into: number; need: number; pct: number }) {
  return (
    <div className="flex-1 min-w-[150px] max-w-[300px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black tracking-[0.14em] uppercase text-[#FFD600]">LV {level}</span>
        <span className="text-[9px] font-black tabular-nums text-white/45">
          {into.toLocaleString()} <span className="text-white/25">/ {need.toLocaleString()} XP</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF6600] to-[#FFD600] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Stat strip pieces ────────────────────────────────────────
export function ShieldsStat({ count, max }: { count: number; max: number }) {
  return (
    <StatCard label="Shields">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, i) => (
          <Shield
            key={i}
            className="w-4 h-4"
            strokeWidth={2.5}
            style={{ color: i < count ? COPPER : "rgba(255,255,255,0.14)", fill: i < count ? `${COPPER}40` : "transparent" }}
          />
        ))}
      </div>
      <p className="mt-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">{count >= max ? "Full" : `${count} held`}</p>
    </StatCard>
  );
}

export function OvrStat({ ovr, delta }: { ovr: number; delta: number }) {
  return (
    <StatCard label="Fighter OVR">
      <p className="text-[20px] font-black tabular-nums leading-none text-[#FFD600]">{ovr}</p>
      <p className={cn("mt-1 text-[8px] font-black tracking-[0.1em] uppercase", delta > 0 ? "text-[#6BD98A]" : delta < 0 ? "text-[#E60012]" : "text-white/30")}>
        {delta > 0 ? `+${delta} this week` : delta < 0 ? `${delta} this week` : "Holding"}
      </p>
    </StatCard>
  );
}

export function BossCard({ boss }: { boss: Boss }) {
  const pct = Math.round((boss.hpLeft / boss.totalHp) * 100);
  return (
    <div
      className="flex-[1.7] min-w-[180px] border px-3 py-2.5"
      style={{ borderColor: `${RED}55`, background: `linear-gradient(180deg, ${RED}12, transparent)` }}
    >
      <div className="flex items-center justify-between">
        <Micro className="text-[#E60012]/80">Weekly Boss · {boss.daysLeft} day{boss.daysLeft === 1 ? "" : "s"}</Micro>
        <span className="text-[8px] font-black tabular-nums text-white/45">{boss.hpLeft.toLocaleString()} HP left</span>
      </div>
      <p className="mt-1 text-[13px] font-black tracking-[0.08em] uppercase text-white leading-none">
        {boss.defeated ? `${boss.name} — DOWN` : boss.name}
      </p>
      <div className="mt-2 h-2 bg-white/8 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: boss.defeated ? GREEN : RED }} />
      </div>
    </div>
  );
}

export function OnTrackBadge({ done, total, win, flawless }: { done: number; total: number; win: boolean; flawless: boolean }) {
  const good = win || done >= 2;
  return (
    <span className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1">
      <i className="w-1.5 h-1.5" style={{ backgroundColor: flawless ? AMBER : good ? GREEN : "rgba(255,255,255,0.3)" }} />
      <span className="text-[8px] font-black tracking-[0.12em] uppercase text-white/55">
        {flawless ? "Flawless day" : win ? "Won day" : good ? "On track for a win" : "Behind"} · {done}/{total}
      </span>
    </span>
  );
}

// ─── XP Today + quests (3rd column of the selected day) ───────
export function XpToday({ earned, goal, quests }: { earned: number; goal: number; quests: Quest[] }) {
  const doneCount = quests.filter((q) => q.done).length;
  return (
    <div className="border border-white/8 bg-white/[0.015] px-3.5 py-3 h-full">
      <Micro>XP Today</Micro>
      <p className="mt-1 text-[28px] font-black tabular-nums leading-none text-[#FFD600]">
        {earned}<span className="text-[13px] text-white/30 ml-1">/ {goal}</span>
      </p>
      <p className="mt-3 text-[8px] font-black tracking-[0.16em] uppercase text-white/35">Quests {doneCount}/{quests.length}</p>
      <div className="mt-1.5 space-y-1">
        {quests.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={cn("w-3.5 h-3.5 flex items-center justify-center border flex-shrink-0", q.done ? "border-transparent bg-[#6BD98A]" : "border-white/20")}
            >
              {q.done && <Check className="w-2.5 h-2.5 text-black" strokeWidth={4} />}
            </span>
            <span className={cn("flex-1 min-w-0 text-[11px] truncate", q.done ? "text-white/40 line-through" : "text-white/75")}>{q.label}</span>
            <span className={cn("text-[9px] font-black tabular-nums flex-shrink-0", q.done ? "text-white/25" : "text-[#FFD600]")}>+{q.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fighter card ─────────────────────────────────────────────
const ATTR_ORDER: { key: keyof Attributes; label: string }[] = [
  { key: "striking", label: "Striking" },
  { key: "grappling", label: "Grappling" },
  { key: "strength", label: "Strength" },
  { key: "conditioning", label: "Conditioning" },
  { key: "discipline", label: "Discipline" },
];
export function FighterCard({ name, level, ovr, attrs, note }: { name: string; level: number; ovr: number; attrs: Attributes; note: string | null }) {
  return (
    <div className="border bg-white/[0.015] p-3.5" style={{ borderColor: `${COPPER}44` }}>
      <div className="flex items-start justify-between">
        <div>
          <Micro className="text-[#C57B4E]">Fighter Card</Micro>
          <p className="mt-1 text-[13px] font-black tracking-[0.08em] uppercase text-white leading-none">{name} · LV {level}</p>
        </div>
        <span className="text-[28px] font-black tabular-nums leading-none text-[#FFD600]">{ovr}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {ATTR_ORDER.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-[86px] text-[8px] font-black tracking-[0.12em] uppercase text-white/45 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-white/8 overflow-hidden">
              <div className="h-full" style={{ width: `${attrs[key]}%`, backgroundColor: COPPER }} />
            </div>
            <span className="w-6 text-right text-[10px] font-black tabular-nums text-white/70 flex-shrink-0">{attrs[key]}</span>
          </div>
        ))}
      </div>
      {note && <p className="mt-2.5 text-[9px] font-bold tracking-[0.04em] uppercase text-[#E60012]/80">{note}</p>}
    </div>
  );
}

// ─── Technique cards ──────────────────────────────────────────
const TECH_LABEL: Record<string, string> = { mistake: "Mistake", fix: "Fixing", technique: "Drill" };
export function TechniqueCards({ cards, conquered }: { cards: TechCard[]; conquered: number }) {
  return (
    <div className="border border-white/8 bg-white/[0.015] p-3.5">
      <div className="flex items-center justify-between">
        <Micro>Technique Cards · Open</Micro>
        <span className="text-[8px] font-black tracking-[0.12em] uppercase text-white/35">{conquered} conquered</span>
      </div>
      <div className="mt-2.5 space-y-0">
        {cards.length === 0 && (
          <p className="text-[10px] font-bold tracking-[0.04em] uppercase text-white/25 py-2">
            Log mistakes &amp; fixes on your MMA sessions — they surface here.
          </p>
        )}
        {cards.slice(0, 6).map((c, i) => {
          const color = c.done ? GREEN : c.type === "mistake" ? RED : AMBER;
          const label = c.done ? "Done" : TECH_LABEL[c.type];
          return (
            <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-white/5 last:border-b-0">
              <span className="w-12 text-[8px] font-black tracking-[0.1em] uppercase flex-shrink-0" style={{ color }}>{label}</span>
              <span className={cn("flex-1 min-w-0 text-[11px] truncate", c.done ? "text-white/40 line-through" : "text-white/75")}>{c.text}</span>
              <span className="text-[9px] font-black tabular-nums text-white/40 flex-shrink-0">
                {c.done ? <Check className="w-3.5 h-3.5 text-[#6BD98A]" strokeWidth={3} /> : c.type === "fix" ? `${c.progress}/3` : `×${c.count}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Achievements ─────────────────────────────────────────────
export function Achievements({ list, earned }: { list: Achievement[]; earned: number }) {
  const shown = list.slice(0, 6);
  const extra = list.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.14em] uppercase text-white/45">
        <Trophy className="w-3 h-3 text-[#FFD600]" /> Achievements {earned}/{list.length}
      </span>
      {shown.map((a) => (
        <span
          key={a.key}
          title={a.label}
          className={cn(
            "flex items-center gap-1 px-2 py-1 border text-[8px] font-black tracking-[0.08em] uppercase",
            a.earned ? "border-[#C57B4E]/50 text-[#C57B4E]" : "border-white/8 text-white/25"
          )}
        >
          {!a.earned && <Lock className="w-2.5 h-2.5" />}
          {a.label}{a.progress && !a.earned ? ` ${a.progress}` : ""}
        </span>
      ))}
      {extra > 0 && <span className="text-[8px] font-black tracking-[0.1em] uppercase text-white/30">+{extra} more</span>}
    </div>
  );
}
