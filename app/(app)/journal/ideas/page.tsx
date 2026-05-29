"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Lightbulb, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

import { Topbar }    from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { Input }     from "@/components/ui/input";

import { useJournal } from "@/lib/hooks/use-journal";
import { cn } from "@/lib/utils";

interface IdeaItem {
  text:  string;
  date:  string;
  index: number;
}

export default function IdeasPage() {
  const { entries, loading, loadEntries } = useJournal();
  const [search, setSearch] = useState("");

  useEffect(() => { loadEntries(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allIdeas = useMemo<IdeaItem[]>(() => {
    const out: IdeaItem[] = [];
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    for (const entry of sorted) {
      entry.ideas.forEach((text, i) => {
        out.push({ text, date: entry.date, index: i });
      });
    }
    return out;
  }, [entries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allIdeas;
    const q = search.toLowerCase();
    return allIdeas.filter((idea) => idea.text.toLowerCase().includes(q));
  }, [allIdeas, search]);

  return (
    <>
      <Topbar
        title="Ideas"
        subtitle={`${allIdeas.length} captured`}
      />

      <PageShell>
        {/* Search */}
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas…"
              className="pl-8 bg-transparent border-white/15 text-sm text-white placeholder:text-white/55 focus-visible:ring-[#00C9A7]/30"
            />
          </div>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Lightbulb className="w-8 h-8 text-white/20" />
            <p className="text-sm text-white/40">
              {allIdeas.length === 0
                ? "No ideas logged yet. Add them from the journal entry."
                : "No ideas match your search."}
            </p>
          </div>
        )}

        {/* List */}
        <div className="flex flex-col gap-2">
          {filtered.map((idea, i) => (
            <motion.div
              key={`${idea.date}-${idea.index}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="group flex items-start gap-4 border border-white/8 bg-[#080808] px-4 py-3.5 hover:border-[#00C9A7]/30 hover:bg-[#00C9A7]/[0.03] transition-colors"
            >
              {/* Accent dot */}
              <div className="mt-1.5 w-1.5 h-1.5 bg-[#00C9A7] shrink-0" />

              {/* Idea text */}
              <p className="flex-1 text-sm text-white leading-relaxed">{idea.text}</p>

              {/* Date + link */}
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span className="text-[10px] font-black tracking-[0.08em] uppercase text-white/50">
                  {format(parseISO(idea.date), "d MMM yyyy")}
                </span>
                <Link
                  href={`/journal?date=${idea.date}`}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "text-white/40 hover:text-[#00C9A7]"
                  )}
                  title="Open journal entry"
                >
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </PageShell>
    </>
  );
}
