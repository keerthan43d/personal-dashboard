"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Checkin } from "@/lib/db/fight-camp-repository";
import { GREEN, AMBER, RED, Micro, Field, PrimaryBtn } from "./shared";

const SORENESS_COLORS = [GREEN, "#B8D96B", AMBER, "#FF6600", RED];

export function CheckinBlock({
  date, checkin, prevWeight, weightUnit, busy, onSave,
}: {
  date: string;
  checkin: Checkin | null;
  prevWeight: number | null;
  weightUnit: string;
  busy: boolean;
  onSave: (c: Checkin) => Promise<void>;
}) {
  const [weight, setWeight] = useState(checkin?.weight != null ? String(checkin.weight) : "");
  const [sleep, setSleep] = useState(checkin?.sleepHours != null ? String(checkin.sleepHours) : "");
  const [soreness, setSoreness] = useState<number | null>(checkin?.soreness ?? null);
  const [energy, setEnergy] = useState<number | null>(checkin?.energy ?? null);
  const [savedTick, setSavedTick] = useState(false);

  // Re-hydrate during render when the day or its saved check-in changes
  // (covers the async per-day load that arrives after first mount).
  const sig = `${date}:${checkin ? `${checkin.weight}/${checkin.sleepHours}/${checkin.soreness}/${checkin.energy}` : "none"}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setWeight(checkin?.weight != null ? String(checkin.weight) : "");
    setSleep(checkin?.sleepHours != null ? String(checkin.sleepHours) : "");
    setSoreness(checkin?.soreness ?? null);
    setEnergy(checkin?.energy ?? null);
    setSavedTick(false);
  }

  const w = weight === "" ? null : Number(weight);
  const delta = w != null && prevWeight != null ? round(w - prevWeight) : null;

  async function save() {
    await onSave({
      date,
      weight: w,
      sleepHours: sleep === "" ? null : Number(sleep),
      soreness, energy,
    });
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1800);
  }

  const dirty =
    (weight || "") !== (checkin?.weight != null ? String(checkin.weight) : "") ||
    (sleep || "") !== (checkin?.sleepHours != null ? String(checkin.sleepHours) : "") ||
    soreness !== (checkin?.soreness ?? null) ||
    energy !== (checkin?.energy ?? null);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {/* Weight */}
        <div>
          <Micro>Weight</Micro>
          <div className="mt-1.5 flex items-baseline gap-1">
            <Field type="number" value={weight} onChange={setWeight} placeholder="—" className="w-full min-w-0 text-xl font-black py-1" />
            <span className="text-[10px] font-black uppercase text-white/30 flex-shrink-0">{weightUnit}</span>
          </div>
          <p className={cn("mt-1 text-[9px] font-black tabular-nums h-3", delta == null ? "text-white/0" : delta <= 0 ? "text-[#6BD98A]" : "text-[#FF6600]")}>
            {delta == null ? "·" : `${delta > 0 ? "+" : ""}${delta} ${weightUnit} vs last`}
          </p>
        </div>

        {/* Sleep */}
        <div>
          <Micro>Sleep</Micro>
          <div className="mt-1.5 flex items-baseline gap-1">
            <Field type="number" value={sleep} onChange={setSleep} placeholder="—" className="w-full min-w-0 text-xl font-black py-1" />
            <span className="text-[10px] font-black uppercase text-white/30 flex-shrink-0">h</span>
          </div>
          <p className="mt-1 h-3" />
        </div>

        {/* Soreness */}
        <div>
          <Micro>Soreness</Micro>
          <Scale value={soreness} onChange={setSoreness} colors={SORENESS_COLORS} />
        </div>

        {/* Energy */}
        <div>
          <Micro>Energy</Micro>
          <Scale value={energy} onChange={setEnergy} colors={[...SORENESS_COLORS].reverse()} />
        </div>
      </div>

      {/* Save */}
      <div className="mt-4 flex items-center gap-2">
        <PrimaryBtn onClick={save} disabled={busy || !dirty}>{checkin ? "Update Check-in" : "Log Check-in"}</PrimaryBtn>
        {savedTick && (
          <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.12em] uppercase text-[#6BD98A]">
            <Check className="w-3 h-3" strokeWidth={3} /> Logged
          </span>
        )}
      </div>
    </div>
  );
}

function Scale({ value, onChange, colors }: { value: number | null; onChange: (v: number | null) => void; colors: string[] }) {
  return (
    <div className="mt-1.5 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            "w-5 h-5 flex-shrink-0 border text-[8px] font-black tabular-nums leading-none transition-all cursor-pointer",
            (value ?? 0) >= n ? "border-transparent text-black" : "border-white/12 text-white/0 hover:border-white/30"
          )}
          style={(value ?? 0) >= n ? { backgroundColor: colors[(value ?? 1) - 1] } : undefined}
        >
          {n}
        </button>
      ))}
      <span className="ml-1 text-[11px] font-black tabular-nums text-white/55">{value ? `${value}/5` : ""}</span>
    </div>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;
