"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, X, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Food, type Meal, type FoodEntry, type FoodSlot, type Settings, type MealItem,
} from "@/lib/db/fight-camp-repository";
import { COPPER, GREEN, AMBER, FOOD_SLOTS, Micro, Field, PrimaryBtn, IconBtn } from "./shared";

export function NutritionBlock({
  date, foods, meals, entries, settings, busy,
  onAddEntry, onDeleteEntry, onLogMeal, onCreateMeal,
}: {
  date: string;
  foods: Food[];
  meals: Meal[];
  entries: FoodEntry[];
  settings: Settings;
  busy: boolean;
  onAddEntry: (e: Omit<FoodEntry, "id">) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onLogMeal: (meal: Meal) => Promise<void>;
  onCreateMeal: (name: string, items: MealItem[], slot: FoodSlot) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [slot, setSlot] = useState<FoodSlot>("breakfast");
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState(1);
  // manual quick-add
  const [mLabel, setMLabel] = useState("");
  const [mKcal, setMKcal] = useState("");
  const [mProtein, setMProtein] = useState("");
  // save-as-meal
  const [mealName, setMealName] = useState("");

  const totals = useMemo(() => entries.reduce(
    (a, e) => ({ kcal: a.kcal + e.kcal, protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fat: a.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  ), [entries]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return foods.slice(0, 6);
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, foods]);

  async function addFood(f: Food) {
    await onAddEntry({
      date, slot,
      label: `${qty !== 1 ? `${qty}× ` : ""}${f.name}${f.serving ? ` (${f.serving})` : ""}`,
      kcal: round(f.kcal * qty), protein: round(f.protein * qty), carbs: round(f.carbs * qty), fat: round(f.fat * qty),
      sort: entries.length,
    });
    setSearch(""); setQty(1);
  }

  async function addManual() {
    if (!mLabel.trim()) return;
    await onAddEntry({
      date, slot, label: mLabel.trim(),
      kcal: Number(mKcal) || 0, protein: Number(mProtein) || 0, carbs: 0, fat: 0, sort: entries.length,
    });
    setMLabel(""); setMKcal(""); setMProtein("");
  }

  async function saveAsMeal() {
    if (!mealName.trim() || entries.length === 0) return;
    const items: MealItem[] = entries.map((e) => ({
      name: e.label, qty: 1, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat,
    }));
    await onCreateMeal(mealName.trim(), items, slot);
    setMealName("");
  }

  return (
    <div>
      {/* Header + saved meals */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Micro>Fuel</Micro>
        <div className="flex flex-wrap items-center gap-1.5">
          {meals.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={busy}
              onClick={() => onLogMeal(m)}
              title={`Log ${m.name} — ${sumMeal(m).kcal} kcal · ${sumMeal(m).protein} g protein`}
              className="px-2.5 py-1.5 border border-white/12 text-[9px] font-black tracking-[0.08em] uppercase text-white/55 hover:border-white/30 hover:text-white/85 transition-all cursor-pointer disabled:opacity-40"
            >
              {m.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#E60012] text-white text-[9px] font-black tracking-[0.1em] uppercase hover:bg-[#ff1a2b] transition-colors cursor-pointer"
          >
            {adding ? <X className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={3} />} Food
          </button>
        </div>
      </div>

      {/* Macro bars — protein is the hero, the rest sit in a row beneath */}
      <div className="mt-3 space-y-2.5">
        <MacroBar label="Protein" value={totals.protein} target={settings.proteinTarget} unit="g" color={GREEN} primary />
        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="Kcal" value={totals.kcal} target={settings.kcalTarget} unit="" color={COPPER} />
          <MacroBar label="Carbs" value={totals.carbs} target={settings.carbsTarget} unit="g" color={AMBER} />
          <MacroBar label="Fat" value={totals.fat} target={settings.fatTarget} unit="g" color="#9B8CFF" />
        </div>
      </div>

      {/* Add panel */}
      {adding && (
        <div className="mt-3 border border-white/10 bg-white/[0.015] p-3">
          {/* slot */}
          <div className="flex flex-wrap gap-1.5">
            {FOOD_SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase border transition-all cursor-pointer",
                  slot === s ? "border-[#E60012] bg-[#E60012]/15 text-white" : "border-white/12 text-white/40 hover:text-white/70"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* library search */}
          <div className="mt-2.5 flex items-center gap-2">
            <Field value={search} onChange={setSearch} placeholder="Search food library…" className="flex-1" />
            <div className="flex items-center gap-1">
              <Micro>Qty</Micro>
              <Field type="number" value={String(qty)} onChange={(v) => setQty(Math.max(0.25, Number(v) || 1))} className="w-14 text-center py-1" />
            </div>
          </div>
          <div className="mt-1 border border-white/10 bg-[#0d0d0d] divide-y divide-white/5">
            {matches.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => addFood(f)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-white/5 cursor-pointer"
              >
                <span className="text-[12px] text-white/80">{f.name} <span className="text-white/30">{f.serving}</span></span>
                <span className="text-[10px] text-white/45 tabular-nums">{round(f.kcal * qty)} kcal · {round(f.protein * qty)}g P</span>
              </button>
            ))}
            {matches.length === 0 && <p className="px-2.5 py-2 text-[10px] text-white/30">No match — add it manually below.</p>}
          </div>

          {/* manual quick add */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Field value={mLabel} onChange={setMLabel} placeholder="Manual: what did you eat?" className="flex-1 min-w-[160px]" />
            <Field type="number" value={mKcal} onChange={setMKcal} placeholder="kcal" className="w-20 text-center" />
            <Field type="number" value={mProtein} onChange={setMProtein} placeholder="protein g" className="w-24 text-center" />
            <PrimaryBtn onClick={addManual} disabled={busy || !mLabel.trim()}>Add</PrimaryBtn>
          </div>

          {/* save as meal */}
          {entries.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-2.5">
              <Bookmark className="w-3.5 h-3.5 text-white/30" />
              <Field value={mealName} onChange={setMealName} placeholder="Save today's log as a meal…" className="flex-1 min-w-[160px]" />
              <button
                type="button"
                onClick={saveAsMeal}
                disabled={busy || !mealName.trim()}
                className="px-3 py-2 border border-white/12 text-white/60 text-[9px] font-black tracking-[0.12em] uppercase hover:border-white/30 hover:text-white/85 transition-all cursor-pointer disabled:opacity-30"
              >
                Save Meal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Food log */}
      <div className="mt-3 border-t border-white/8">
        {entries.length === 0 ? (
          <p className="py-3 text-[10px] font-bold tracking-[0.06em] uppercase text-white/25">Nothing logged yet today.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="group flex items-center gap-3 py-2 border-b border-white/5 last:border-b-0">
              <span className="w-[72px] flex-shrink-0 text-[8px] font-black tracking-[0.14em] uppercase text-white/35">{e.slot}</span>
              <span className="flex-1 min-w-0 text-[12px] text-white/80 truncate">{e.label}</span>
              <span className="text-[11px] text-white/45 tabular-nums flex-shrink-0">{Math.round(e.kcal)}</span>
              <span className="text-[11px] text-[#C57B4E] tabular-nums flex-shrink-0 w-10 text-right">{Math.round(e.protein)} g</span>
              <IconBtn title="Remove" onClick={() => onDeleteEntry(e.id)}>
                <Trash2 className="w-3 h-3" />
              </IconBtn>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Macro bar ────────────────────────────────────────────────
function MacroBar({
  label, value, target, unit, color, primary,
}: { label: string; value: number; target: number; unit: string; color: string; primary?: boolean }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-1">
        <Micro className={primary ? "text-white/60" : undefined}>{label}</Micro>
        <span className={cn("font-black tabular-nums", primary ? "text-[12px] text-white/85" : "text-[10px] text-white/65")}>
          {Math.round(value)}<span className="text-white/30">/{Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className={cn("mt-1.5 bg-white/8 overflow-hidden", primary ? "h-2.5" : "h-1.5")}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────
const round = (n: number) => Math.round(n * 10) / 10;
function sumMeal(m: Meal) {
  return m.items.reduce(
    (a, it) => ({ kcal: Math.round(a.kcal + it.kcal), protein: Math.round(a.protein + it.protein) }),
    { kcal: 0, protein: 0 }
  );
}
