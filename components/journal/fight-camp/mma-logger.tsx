"use client";
import { useState } from "react";
import { Plus, Trash2, Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Session, type SessionInput, type SparRound, type SparResult, type Learning, type LearningType,
} from "@/lib/db/fight-camp-repository";
import {
  FOCUS_OPTIONS, RESULT_COLOR, RESULT_LABEL, LEARNING_COLOR, RED,
  Micro, Chip, PrimaryBtn, Stepper, Field, SlotShell, IconBtn,
} from "./shared";

const RESULTS: SparResult[] = ["win", "even", "loss"];
const LEARNING_TYPES: LearningType[] = ["mistake", "fix", "technique"];

export function MmaLogger({
  date, campId, session, busy, onSave, onDelete,
}: {
  date: string;
  campId: string | null;
  session: Session | null;
  busy: boolean;
  onSave: (s: SessionInput) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [focus, setFocus] = useState<string>(session?.focus ?? "");
  const [duration, setDuration] = useState(session?.durationMin ?? 0);
  const [effort, setEffort] = useState(session?.effort ?? 0);
  const [rounds, setRounds] = useState<SparRound[]>(session?.sparRounds ?? []);
  const [learnings, setLearnings] = useState<Learning[]>(session?.learnings ?? []);
  const [note, setNote] = useState(session?.note ?? "");

  // Re-hydrate the draft during render when the day / its session changes.
  const sig = `${date}:${session?.id ?? "new"}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setEditing(false);
    setFocus(session?.focus ?? "");
    setDuration(session?.durationMin ?? 0);
    setEffort(session?.effort ?? 0);
    setRounds(session?.sparRounds ?? []);
    setLearnings(session?.learnings ?? []);
    setNote(session?.note ?? "");
  }

  async function save() {
    const payload: SessionInput = {
      campId, date, kind: "mma",
      focus: focus || null,
      durationMin: duration || null,
      effort: effort || null,
      sparRounds: rounds,
      learnings: learnings.filter((l) => l.text.trim()),
      gymEntries: [],
      note: note.trim() || null,
    };
    await onSave(payload);
    setEditing(false);
  }

  // ── Collapsed: no session yet ───────────────────────────────
  if (!session && !editing) {
    return (
      <SlotShell>
        <div className="flex items-center justify-between">
          <div>
            <Micro>MMA</Micro>
            <p className="mt-1 text-[12px] font-black tracking-[0.08em] uppercase text-white/55">Not logged</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-2 bg-[#E60012] text-white text-[9px] font-black tracking-[0.12em] uppercase hover:bg-[#ff1a2b] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" strokeWidth={3} /> Log MMA
          </button>
        </div>
      </SlotShell>
    );
  }

  // ── Summary: session logged, not editing ────────────────────
  if (session && !editing) {
    const rec = tallyRounds(session.sparRounds);
    return (
      <SlotShell accent={RED}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Micro>MMA{session.focus ? ` · ${session.focus}` : ""}</Micro>
            <p className="mt-1 text-[13px] font-black tracking-[0.04em] uppercase text-white leading-tight">
              {session.focus || "Session"}
              {session.durationMin ? ` · ${session.durationMin} min` : ""}
              {session.effort ? ` · Effort ${session.effort}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase text-[#6BD98A]">
              <Check className="w-3 h-3" strokeWidth={3} /> Done
            </span>
            <IconBtn title="Edit session" onClick={() => setEditing(true)}><Pencil className="w-3 h-3" /></IconBtn>
          </div>
        </div>

        {session.sparRounds.length > 0 && (
          <div className="mt-2.5">
            <div className="flex flex-wrap gap-1">
              {session.sparRounds.map((r, i) => (
                <span
                  key={i}
                  title={[r.partner, r.length ? `${r.length} min` : "", r.note].filter(Boolean).join(" · ")}
                  className="w-8 h-6 flex items-center justify-center text-[9px] font-black tracking-wide text-black"
                  style={{ backgroundColor: RESULT_COLOR[r.result] }}
                >
                  R{r.round}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[9px] font-black tracking-[0.1em] uppercase text-white/40 tabular-nums">
              {rec.win}W · {rec.even}E · {rec.loss}L over {session.sparRounds.length} rounds
            </p>
          </div>
        )}

        {session.learnings.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {session.learnings.map((l, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span
                  className="mt-[1px] text-[8px] font-black tracking-[0.14em] uppercase flex-shrink-0"
                  style={{ color: LEARNING_COLOR[l.type] }}
                >
                  {l.type}
                </span>
                <span className="text-[11px] text-white/70 leading-snug">{l.text}</span>
              </div>
            ))}
          </div>
        )}

        {session.note && <p className="mt-2 text-[11px] text-white/50 leading-snug italic">{session.note}</p>}
      </SlotShell>
    );
  }

  // ── Editing form ────────────────────────────────────────────
  return (
    <SlotShell accent={RED}>
      <div className="flex items-center justify-between">
        <Micro className="text-white/60">Logging MMA Session</Micro>
        <button
          type="button"
          onClick={() => { if (session) setEditing(false); else { setEditing(false); } }}
          className="flex items-center gap-1 text-[8px] font-black tracking-[0.12em] uppercase text-white/35 hover:text-white/70 cursor-pointer"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>

      {/* Focus */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {FOCUS_OPTIONS.map((f) => (
          <Chip key={f} on={focus === f} onClick={() => setFocus(focus === f ? "" : f)} color={RED}>{f}</Chip>
        ))}
      </div>

      {/* Duration + effort */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Micro>Duration</Micro>
          <div className="flex items-center gap-1">
            <Field
              type="number" value={duration ? String(duration) : ""}
              onChange={(v) => setDuration(Math.max(0, Math.round(Number(v) || 0)))}
              placeholder="0" className="w-16 text-center"
            />
            <span className="text-[9px] font-black uppercase text-white/30">min</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Micro>Effort</Micro>
          <Stepper value={effort} onChange={setEffort} min={0} max={10} />
          <span className="text-[9px] font-black uppercase text-white/30">/ 10</span>
        </div>
      </div>

      {/* Spar rounds */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <Micro>Sparring rounds</Micro>
          <button
            type="button"
            onClick={() => setRounds((r) => [...r, { round: r.length + 1, result: "even" }])}
            className="flex items-center gap-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/45 hover:text-white cursor-pointer"
          >
            <Plus className="w-3 h-3" strokeWidth={3} /> Round
          </button>
        </div>
        {rounds.length > 0 && (
          <div className="mt-1.5 space-y-1.5">
            {rounds.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-6 text-[9px] font-black text-white/40 tabular-nums">R{r.round}</span>
                <div className="flex">
                  {RESULTS.map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setRounds((rs) => rs.map((x, j) => j === i ? { ...x, result: res } : x))}
                      className={cn(
                        "w-7 h-7 text-[9px] font-black border-y border-l last:border-r border-white/12 transition-colors cursor-pointer",
                        r.result === res ? "text-black" : "text-white/40 hover:text-white/70"
                      )}
                      style={r.result === res ? { backgroundColor: RESULT_COLOR[res], borderColor: RESULT_COLOR[res] } : undefined}
                    >
                      {RESULT_LABEL[res]}
                    </button>
                  ))}
                </div>
                <Field
                  value={r.partner ?? ""} onChange={(v) => setRounds((rs) => rs.map((x, j) => j === i ? { ...x, partner: v } : x))}
                  placeholder="partner" className="flex-1 min-w-0 py-1"
                />
                <IconBtn title="Remove round" onClick={() => setRounds((rs) => rs.filter((_, j) => j !== i).map((x, k) => ({ ...x, round: k + 1 })))}>
                  <Trash2 className="w-3 h-3" />
                </IconBtn>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learnings */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <Micro>Learnings</Micro>
          <button
            type="button"
            onClick={() => setLearnings((l) => [...l, { text: "", type: "mistake", tags: [] }])}
            className="flex items-center gap-1 text-[8px] font-black tracking-[0.1em] uppercase text-white/45 hover:text-white cursor-pointer"
          >
            <Plus className="w-3 h-3" strokeWidth={3} /> Learning
          </button>
        </div>
        {learnings.length > 0 && (
          <div className="mt-1.5 space-y-1.5">
            {learnings.map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="flex">
                  {LEARNING_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLearnings((ls) => ls.map((x, j) => j === i ? { ...x, type: t } : x))}
                      title={t}
                      className={cn(
                        "px-1.5 h-7 text-[8px] font-black uppercase border-y border-l last:border-r border-white/12 transition-colors cursor-pointer",
                        l.type === t ? "text-black" : "text-white/35 hover:text-white/60"
                      )}
                      style={l.type === t ? { backgroundColor: LEARNING_COLOR[t], borderColor: LEARNING_COLOR[t] } : undefined}
                    >
                      {t[0]}
                    </button>
                  ))}
                </div>
                <Field
                  value={l.text} onChange={(v) => setLearnings((ls) => ls.map((x, j) => j === i ? { ...x, text: v } : x))}
                  placeholder="what happened / the fix / the technique" className="flex-1 min-w-0 py-1"
                />
                <IconBtn title="Remove learning" onClick={() => setLearnings((ls) => ls.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3 h-3" />
                </IconBtn>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <Field value={note} onChange={setNote} placeholder="Anything else from the session…" className="mt-3 w-full" />

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <PrimaryBtn onClick={save} disabled={busy}>{session ? "Update MMA" : "Save MMA"}</PrimaryBtn>
        {session && (
          <IconBtn title="Delete this session" danger onClick={onDelete} disabled={busy}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        )}
      </div>
    </SlotShell>
  );
}

function tallyRounds(rs: SparRound[]) {
  return rs.reduce(
    (a, r) => ({ ...a, [r.result]: (a as Record<string, number>)[r.result] + 1 }),
    { win: 0, even: 0, loss: 0 } as { win: number; even: number; loss: number }
  );
}
