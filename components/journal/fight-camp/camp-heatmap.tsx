"use client";
import { useMemo } from "react";
import { format, parseISO, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { type Camp, type Session } from "@/lib/db/fight-camp-repository";
import { GREEN, COPPER, Micro } from "./shared";

export function CampHeatmap({
  camp, sessions, today, viewedDate,
}: { camp: Camp; sessions: Session[]; today: string; viewedDate: string }) {
  const days = useMemo(() => {
    const mma = new Set<string>();
    const gym = new Set<string>();
    for (const s of sessions) {
      if (s.kind === "mma") mma.add(s.date);
      else if (s.kind === "gym") gym.add(s.date);
    }
    return Array.from({ length: camp.lengthDays }, (_, i) => {
      const date = format(addDays(parseISO(camp.startDate), i), "yyyy-MM-dd");
      return { index: i + 1, date, mma: mma.has(date), gym: gym.has(date), both: mma.has(date) && gym.has(date) };
    });
  }, [camp, sessions]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Micro>{camp.lengthDays} days · top MMA, bottom gym</Micro>
        <div className="flex items-center gap-2.5">
          <Legend color={GREEN} label="MMA" />
          <Legend color={COPPER} label="Gym" />
          <Legend ring label="Flawless" />
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-[3px] w-max">
          {days.map((d) => {
            const isToday = d.date === today;
            const isViewed = d.date === viewedDate;
            const future = d.date > today;
            return (
              <div
                key={d.index}
                className={cn("flex flex-col gap-[3px] p-[2px]", d.both && "ring-1 ring-[#FFD600]/70")}
                title={`Day ${d.index} · ${format(parseISO(d.date), "EEE d MMM")}${d.mma ? " · MMA" : ""}${d.gym ? " · Gym" : ""}`}
              >
                <Cell on={d.mma} color={GREEN} future={future} ring={isToday} viewed={isViewed} />
                <Cell on={d.gym} color={COPPER} future={future} ring={isToday} viewed={isViewed} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Cell({ on, color, future, ring, viewed }: { on: boolean; color: string; future: boolean; ring: boolean; viewed: boolean }) {
  return (
    <div
      className={cn("w-4 h-4 transition-colors", ring && "ring-1 ring-[#FFD600]", !ring && viewed && "ring-1 ring-white/50")}
      style={{ backgroundColor: on ? color : future ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.06)" }}
    />
  );
}

function Legend({ color, label, ring }: { color?: string; label: string; ring?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/30">
      <i className={cn("w-2 h-2", ring && "ring-1 ring-[#FFD600]/70")} style={{ backgroundColor: color ?? "transparent" }} />
      {label}
    </span>
  );
}
