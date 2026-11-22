"use client";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Check, Pencil, X, Dumbbell } from "lucide-react";
import {
  type Session, type SessionInput, type GymEntry, type GymSet, type Exercise,
  lastExerciseEntry, exerciseBest,
} from "@/lib/db/fight-camp-repository";
import { COPPER, Micro, PrimaryBtn, Field, SlotShell, IconBtn } from "./shared";

export function GymLogger({
  date, campId, session, allSessions, exercises, busy, onSave, onDelete, onCreateExercise,
}: {
  date: string;
  campId: string | null;
  session: Session | null;
  allSessions: Session[];
  exercises: Exercise[];
  busy: boolean;
  onSave: (s: SessionInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateExercise: (name: string, muscle?: string | null) => Promise<Exercise>;
}) {
  const [editing, setEditing] = useState(false);
  const [entries, setEntries] = useState<GymEntry[]>(session?.gymEntries ?? []);
  const [search, setSearch] = useState("");

  // Re-hydrate during render when the day / its session changes.
  const sig = `${date}:${session?.id ?? "new"}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setEditing(false);
    setEntries(session?.gymEntries ?? []);
    setSearch("");
  }

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, exercises]);

  const exactMatch = useMemo(
    () => exercises.some((e) => e.name.toLowerCase() === search.trim().toLowerCase()),
    [search, exercises]
  );

  function addEntry(ex: { id: string | null; name: string; muscle?: string | null }) {
    setEntries((es) => [...es, { exerciseId: ex.id, name: ex.name, muscle: ex.muscle ?? undefined, sets: [{ weight: null, reps: null }] }]);
    setSearch("");
  }

  async function addNew() {
    const name = search.trim();
    if (!name) return;
    const ex = await onCreateExercise(name, null);
    addEntry({ id: ex.id, name: ex.name, muscle: ex.muscle });
  }

  function updateSet(ei: number, si: number, patch: Partial<GymSet>) {
    setEntries((es) => es.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.map((s, j) => j === si ? { ...s, ...patch } : s),
    }));
  }

  async function save() {
    // Flag PRs at save time: a set is a PR if its weight beats the all-time best before today.
    const cleaned: GymEntry[] = entries
      .map((e) => {
        const best = exerciseBest(allSessions, e.exerciseId, e.name, date);
        const sets = e.sets
          .filter((s) => s.weight != null || s.reps != null)
          .map((s) => ({ ...s, isPR: (s.weight ?? 0) > 0 && (s.weight ?? 0) > best }));
        return { ...e, sets };
      })
      .filter((e) => e.sets.length > 0);
    await onSave({
      campId, date, kind: "gym",
      focus: null, durationMin: null, effort: null, sparRounds: [], learnings: [],
      gymEntries: cleaned, note: null,
    });
    setEditing(false);
  }

  // ── Collapsed: no session ───────────────────────────────────
  if (!session && !editing) {
    return (
      <SlotShell>
        <div className="flex items-center justify-between">
          <div>
            <Micro>Gym</Micro>
            <p className="mt-1 text-[12px] font-black tracking-[0.08em] uppercase text-white/55">Not logged</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-2 border border-[#C57B4E]/50 text-[#C57B4E] text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#C57B4E]/10 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" strokeWidth={3} /> Log Gym
          </button>
        </div>
      </SlotShell>
    );
  }

  // ── Summary ─────────────────────────────────────────────────
  if (session && !editing) {
    const totalSets = session.gymEntries.reduce((n, e) => n + e.sets.length, 0);
    const prs = session.gymEntries.reduce((n, e) => n + e.sets.filter((s) => s.isPR).length, 0);
    return (
      <SlotShell accent={COPPER}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Micro>Gym</Micro>
            <p className="mt-1 text-[13px] font-black tracking-[0.04em] uppercase text-white leading-tight">
              {session.gymEntries.length} lift{session.gymEntries.length === 1 ? "" : "s"} · {totalSets} sets
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {prs > 0 && (
              <span className="text-[9px] font-black tracking-[0.1em] uppercase text-[#FFD600]">{prs} PR</span>
            )}
            <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase text-[#6BD98A]">
              <Check className="w-3 h-3" strokeWidth={3} /> Done
            </span>
            <IconBtn title="Edit session" onClick={() => setEditing(true)}><Pencil className="w-3 h-3" /></IconBtn>
          </div>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {session.gymEntries.map((e, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-black tracking-[0.04em] uppercase text-white/80 truncate">{e.name}</span>
              <span className="text-[11px] text-white/55 tabular-nums text-right flex-shrink-0">
                {e.sets.map((s, j) => (
                  <span key={j}>
                    {j > 0 && <span className="text-white/20"> · </span>}
                    <span className={s.isPR ? "text-[#FFD600] font-black" : ""}>
                      {s.weight ?? "—"}×{s.reps ?? "—"}{s.isPR ? " PR" : ""}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </SlotShell>
    );
  }

  // ── Editing form ────────────────────────────────────────────
  return (
    <SlotShell accent={COPPER}>
      <div className="flex items-center justify-between">
        <Micro className="text-white/60">Logging Gym Session</Micro>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-[8px] font-black tracking-[0.12em] uppercase text-white/35 hover:text-white/70 cursor-pointer"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>

      {/* Exercise search / add */}
      <div className="mt-2.5 relative">
        <Field value={search} onChange={setSearch} placeholder="Search exercise or add new…" className="w-full" />
        {search.trim() && (
          <div className="mt-1 border border-white/10 bg-[#0d0d0d] divide-y divide-white/5">
            {matches.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => addEntry({ id: e.id, name: e.name, muscle: e.muscle })}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-white/5 cursor-pointer"
              >
                <span className="text-[12px] text-white/80">{e.name}</span>
                {e.muscle && <span className="text-[8px] font-black uppercase tracking-[0.1em] text-white/30">{e.muscle}</span>}
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                onClick={addNew}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[#C57B4E] hover:bg-[#C57B4E]/10 cursor-pointer"
              >
                <Plus className="w-3 h-3" strokeWidth={3} />
                <span className="text-[11px] font-black tracking-[0.04em] uppercase">Add “{search.trim()}”</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="mt-3 space-y-3">
        {entries.length === 0 && (
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.06em] uppercase text-white/25">
            <Dumbbell className="w-3.5 h-3.5" /> Add an exercise to start
          </p>
        )}
        {entries.map((e, ei) => {
          const last = lastExerciseEntry(allSessions, e.exerciseId, e.name, date);
          const best = exerciseBest(allSessions, e.exerciseId, e.name, date);
          return (
            <div key={ei} className="border border-white/8 bg-white/[0.015] p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-[0.05em] uppercase text-white">{e.name}</span>
                <IconBtn title="Remove exercise" onClick={() => setEntries((es) => es.filter((_, i) => i !== ei))}>
                  <Trash2 className="w-3 h-3" />
                </IconBtn>
              </div>
              {last && (
                <p className="mt-1 text-[9px] font-bold tracking-[0.04em] uppercase text-white/35">
                  Last ({format(parseISO(last.date), "EEE d MMM")}):{" "}
                  {last.entry.sets.map((s) => `${s.weight ?? "—"}×${s.reps ?? "—"}`).join(", ")}
                </p>
              )}
              <div className="mt-2 space-y-1.5">
                {e.sets.map((s, si) => {
                  const isPR = (s.weight ?? 0) > 0 && (s.weight ?? 0) > best;
                  return (
                    <div key={si} className="flex items-center gap-1.5">
                      <span className="w-4 text-[10px] font-black text-white/30 tabular-nums">{si + 1}</span>
                      <Field
                        type="number" value={s.weight != null ? String(s.weight) : ""}
                        onChange={(v) => updateSet(ei, si, { weight: v === "" ? null : Number(v) })}
                        placeholder="kg" className="w-16 text-center py-1"
                      />
                      <span className="text-white/25 text-xs">×</span>
                      <Field
                        type="number" value={s.reps != null ? String(s.reps) : ""}
                        onChange={(v) => updateSet(ei, si, { reps: v === "" ? null : Math.round(Number(v)) })}
                        placeholder="reps" className="w-16 text-center py-1"
                      />
                      {isPR && <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#FFD600]">PR</span>}
                      <div className="flex-1" />
                      <IconBtn title="Remove set" onClick={() => setEntries((es) => es.map((x, i) => i !== ei ? x : { ...x, sets: x.sets.filter((_, j) => j !== si) }))}>
                        <X className="w-3 h-3" />
                      </IconBtn>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setEntries((es) => es.map((x, i) => i !== ei ? x : { ...x, sets: [...x.sets, { weight: x.sets.at(-1)?.weight ?? null, reps: null }] }))}
                className="mt-1.5 flex items-center gap-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white cursor-pointer"
              >
                <Plus className="w-3 h-3" strokeWidth={3} /> Set
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <PrimaryBtn onClick={save} disabled={busy || entries.length === 0}>{session ? "Update Gym" : "Save Gym"}</PrimaryBtn>
        {session && (
          <IconBtn title="Delete this session" danger onClick={onDelete} disabled={busy}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        )}
      </div>
    </SlotShell>
  );
}
