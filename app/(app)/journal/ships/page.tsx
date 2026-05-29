"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Rocket, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Topbar }    from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { Input }     from "@/components/ui/input";
import { ShipLogDialog } from "@/components/journal/ship-log-dialog";

import { useProductivity } from "@/lib/hooks/use-productivity";
import { cn } from "@/lib/utils";
import type { ShipLog, ShipLogInput } from "@/lib/db/schemas";

const TYPE_COLORS: Record<string, string> = {
  feature: "#00C9A7",
  page:    "#00D9FF",
  pitch:   "#FFD600",
  video:   "#FF6600",
  design:  "#9B59B6",
  other:   "rgba(255,255,255,0.4)",
};

const TYPES = ["feature", "page", "pitch", "video", "design", "other"] as const;

export default function ShipsPage() {
  const { shipLogs, loading, loadShipLogs, addShip, editShip, removeShip } = useProductivity();

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [editing, setEditing]     = useState<ShipLog | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { loadShipLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = shipLogs;
    if (typeFilter) list = list.filter((s) => s.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [shipLogs, typeFilter, search]);

  async function handleSave(data: ShipLogInput) {
    if (editing) {
      await editShip(editing.id, data);
    } else {
      await addShip(data);
    }
  }

  async function handleDelete() {
    if (editing) {
      await removeShip(editing.id);
      setEditing(undefined);
      setDialogOpen(false);
    }
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <Topbar
        title="Ship Log"
        subtitle={`${shipLogs.length} shipped`}
      />

      <PageShell>
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ships…"
              className="pl-8 bg-transparent border-white/15 text-sm text-white placeholder:text-white/55 focus-visible:ring-[#9B59B6]/30"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              onClick={() => setTypeFilter(null)}
              className={cn(
                "px-2.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase border transition-colors",
                !typeFilter
                  ? "border-[#9B59B6]/50 text-[#9B59B6] bg-[#9B59B6]/5"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/50"
              )}
            >
              All
            </button>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase border transition-colors",
                  typeFilter === t
                    ? "bg-opacity-5"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/50"
                )}
                style={typeFilter === t ? {
                  borderColor: `${TYPE_COLORS[t]}80`,
                  color: TYPE_COLORS[t],
                  backgroundColor: `${TYPE_COLORS[t]}0D`,
                } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Rocket className="w-8 h-8 text-white/20" />
            <p className="text-sm text-white/40">
              {shipLogs.length === 0
                ? "Nothing shipped yet. Start logging from the journal."
                : "No ships match your filter."}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative border border-white/8 bg-[#080808] p-4 hover:border-white/15 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Type dot */}
                <div
                  className="w-2 h-2 mt-1.5 shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[s.type] ?? TYPE_COLORS.other }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{s.title}</p>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#9B59B6] transition-colors shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <p className="text-[10px] font-black tracking-[0.08em] uppercase text-white/50 mt-1">
                    {format(parseISO(s.entryDate), "d MMM yyyy")}
                    <span className="ml-2 px-1.5 py-0.5 border text-[8px]" style={{
                      borderColor: `${TYPE_COLORS[s.type] ?? TYPE_COLORS.other}40`,
                      color: TYPE_COLORS[s.type] ?? TYPE_COLORS.other,
                    }}>
                      {s.type}
                    </span>
                  </p>

                  {s.description && (
                    <p className="text-xs text-white/60 mt-2 line-clamp-2">{s.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => { setEditing(s); setDialogOpen(true); }}
                    className="text-white/45 hover:text-white/60"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeShip(s.id)}
                    className="text-white/45 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <ShipLogDialog
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
