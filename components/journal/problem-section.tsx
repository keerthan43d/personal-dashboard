"use client";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { ProblemDialog } from "./problem-dialog";
import { cn } from "@/lib/utils";
import { useJournal } from "@/lib/hooks/use-journal";
import type { ProblemLog, ProblemLogInput } from "@/lib/db/schemas";

interface Props {
  entryDate: string;
  problems:  ProblemLog[];
}

export function ProblemSection({ entryDate, problems }: Props) {
  const { addProblem, editProblem, removeProblem } = useJournal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProblemLog | undefined>(undefined);

  async function handleSave(data: ProblemLogInput) {
    if (editing) {
      await editProblem(editing.id, data);
    } else {
      await addProblem(data);
    }
  }

  async function handleDelete() {
    if (editing) {
      await removeProblem(editing.id);
      setEditing(undefined);
      setDialogOpen(false);
    }
  }

  return (
    <div className="space-y-2">
      {problems.length === 0 && (
        <p className="text-xs text-white/60 italic">No problems logged today.</p>
      )}

      {problems.map((p) => (
        <div
          key={p.id}
          className="group flex items-start gap-3 border border-white/8 bg-white/[0.02] px-3 py-2.5 hover:border-white/15 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/80 truncate">{p.title}</p>
            {p.whatSolvedIt && (
              <p className="text-xs text-white/40 mt-0.5 truncate">→ {p.whatSolvedIt}</p>
            )}
            {p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] uppercase border border-white/10 text-white/35"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditing(p); setDialogOpen(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-white/60 mt-0.5"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        onClick={() => { setEditing(undefined); setDialogOpen(true); }}
        className={cn(
          "flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase mt-1",
          "text-white/25 hover:text-white/50 transition-colors"
        )}
      >
        <Plus className="w-3 h-3" />
        Add Problem
      </button>

      <ProblemDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(undefined); }}
        entryDate={entryDate}
        existing={editing}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}
