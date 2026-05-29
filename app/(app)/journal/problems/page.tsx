"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Topbar }    from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { Input }     from "@/components/ui/input";
import { ProblemDialog } from "@/components/journal/problem-dialog";

import { useJournal } from "@/lib/hooks/use-journal";
import { cn } from "@/lib/utils";
import type { ProblemLog, ProblemLogInput } from "@/lib/db/schemas";
import { format as dateFmt } from "date-fns";

export default function ProblemsPage() {
  const { problems, loading, loadProblems, addProblem, editProblem, removeProblem } = useJournal();

  const [search,  setSearch]  = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProblemLog | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { loadProblems(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // All unique tags
  const allTags = useMemo(() => {
    const s = new Set<string>();
    problems.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [problems]);

  const filtered = useMemo(() => {
    let list = problems;
    if (tagFilter) list = list.filter((p) => p.tags.includes(tagFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.whatTheProblemWas?.toLowerCase().includes(q) ||
        p.context?.toLowerCase().includes(q) ||
        p.whatSolvedIt?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [problems, tagFilter, search]);

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

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <Topbar
        title="Problem Log"
        subtitle={`${problems.length} logged`}
      />

      <PageShell>
        {/* Search + filter row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems…"
              className="pl-8 bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/45 focus-visible:ring-[#FFD600]/30"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center overflow-x-auto pb-1">
              <button
                onClick={() => setTagFilter(null)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase border transition-colors",
                  !tagFilter
                    ? "border-[#FFD600]/50 text-[#FFD600]/80 bg-[#FFD600]/5"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/50"
                )}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  className={cn(
                    "px-2.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase border transition-colors",
                    tagFilter === t
                      ? "border-[#FFD600]/50 text-[#FFD600]/80 bg-[#FFD600]/5"
                      : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-white/20">
            <p className="text-sm">
              {problems.length === 0
                ? "No problems logged yet. Add one from the journal entry page."
                : "No results matching your filter."}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative border border-white/8 bg-[#080808] p-4 hover:border-white/15 transition-colors cursor-pointer"
              onClick={() => { setEditing(p); setDialogOpen(true); }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(p); setDialogOpen(true); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/45 hover:text-white/60"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <p className="text-sm font-semibold text-white pr-5 leading-snug">{p.title}</p>

              <p className="text-[10px] font-black tracking-[0.08em] uppercase text-white/60 mt-1">
                {dateFmt(parseISO(p.entryDate), "d MMM yyyy")}
                {p.context && <> · {p.context}</>}
              </p>

              {p.whatSolvedIt && (
                <p className="text-xs text-white/75 mt-2 line-clamp-2">→ {p.whatSolvedIt}</p>
              )}

              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] uppercase border border-white/20 text-white/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <ProblemDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditing(undefined); }}
          entryDate={editing?.entryDate ?? todayStr}
          existing={editing}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
        />
      </PageShell>
    </>
  );
}
