"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check, RotateCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useTodos } from "./todos-store";

interface Props {
  /** The day being viewed in the journal (yyyy-MM-dd). */
  entryDate: string;
  /** The real current date (yyyy-MM-dd) — carry-forward target. */
  today: string;
}

export function TodoSection({ entryDate, today }: Props) {
  const { todos, loaded, load, add, toggle, remove } = useTodos();
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loaded) load(today);
  }, [loaded, load, today]);

  const dayTodos = todos.filter((t) => t.dueDate === entryDate);
  const pending = dayTodos.filter((t) => !t.done).length;
  const done = dayTodos.length - pending;

  const handleAdd = async () => {
    const v = text.trim();
    if (!v) return;
    setAdding(true);
    try {
      await add(v, entryDate);
      setText("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {dayTodos.length === 0 && (
        <p className="text-xs text-white/45 italic">No plans for this day yet.</p>
      )}

      {dayTodos.map((t) => {
        const carried = !t.done && format(parseISO(t.createdAt), "yyyy-MM-dd") < t.dueDate;
        return (
          <div
            key={t.id}
            className="group flex items-center gap-2.5 border border-white/8 bg-white/[0.02] px-3 py-2 hover:border-white/15 transition-colors"
          >
            <button
              onClick={() => toggle(t.id, today)}
              aria-label={t.done ? "Mark not done" : "Mark done"}
              className={cn(
                "w-4 h-4 border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                t.done
                  ? "bg-[#6BD98A] border-[#6BD98A]"
                  : "border-white/25 hover:border-white/50"
              )}
            >
              {t.done && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
            </button>

            <span
              className={cn(
                "flex-1 text-sm min-w-0 break-words",
                t.done ? "text-white/35 line-through" : "text-white/85"
              )}
            >
              {t.text}
            </span>

            {carried && (
              <span
                title="Carried over from a previous day"
                className="shrink-0 flex items-center gap-1 text-[8px] font-black tracking-[0.08em] uppercase text-[#FF6600]"
              >
                <RotateCw className="w-2.5 h-2.5" />
                carried
              </span>
            )}

            <button
              onClick={() => remove(t.id)}
              aria-label="Delete plan"
              className="shrink-0 opacity-0 group-hover:opacity-100 text-white/25 hover:text-[#E60012] transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add row */}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a plan…"
          className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || adding}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black tracking-[0.1em] uppercase text-white/50 hover:text-[#4F9DFF] border border-white/10 hover:border-white/25 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {dayTodos.length > 0 && (
        <p className="text-[10px] text-white/30 font-mono pt-0.5">
          {pending} pending · {done} done
        </p>
      )}
    </div>
  );
}
