"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductivity } from "@/lib/hooks/use-productivity";
import { ShipLogDialog } from "./ship-log-dialog";
import type { ShipLog, ShipLogInput } from "@/lib/db/schemas";

interface Props {
  entryDate: string;
}

const TYPE_COLORS: Record<ShipLog["type"], string> = {
  feature: "#00C9A7",
  page:    "#00D9FF",
  pitch:   "#FFD600",
  video:   "#FF6600",
  design:  "#9B59B6",
  other:   "rgba(255,255,255,0.4)",
};

export function ShipLogSection({ entryDate }: Props) {
  const { shipLogs, loadShipLogs, addShip, editShip, removeShip } = useProductivity();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShipLog | undefined>(undefined);

  useEffect(() => {
    loadShipLogs({ entryDate });
  }, [entryDate, loadShipLogs]);

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

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-3.5 h-3.5 text-[#9B59B6]" />
        <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
          Ship Log
        </span>
        {shipLogs.length > 0 && (
          <span className="text-[10px] font-black tracking-[0.08em] text-[#9B59B6] ml-auto">
            {shipLogs.length} shipped
          </span>
        )}
      </div>

      {/* Ship list */}
      {shipLogs.length === 0 && (
        <p className="text-xs text-white/45 italic">Nothing shipped today.</p>
      )}

      {shipLogs.map((ship) => (
        <div
          key={ship.id}
          className="group flex items-center gap-3 border border-white/8 bg-white/[0.02] px-3 py-2.5 hover:border-white/15 transition-colors"
        >
          {/* Type badge */}
          <span
            className="text-[8px] font-black tracking-[0.08em] uppercase px-1.5 py-0.5 border shrink-0"
            style={{
              color: TYPE_COLORS[ship.type],
              borderColor: TYPE_COLORS[ship.type],
            }}
          >
            {ship.type}
          </span>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{ship.title}</p>
            {ship.description && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{ship.description}</p>
            )}
          </div>

          {/* Link icon */}
          {ship.url && (
            <a
              href={ship.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/45 hover:text-white/60 transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Edit / Delete on hover */}
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => { setEditing(ship); setDialogOpen(true); }}
              className="text-white/45 hover:text-white/60 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removeShip(ship.id)}
              className="text-white/45 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={() => { setEditing(undefined); setDialogOpen(true); }}
        className={cn(
          "flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase mt-1",
          "text-white/45 hover:text-[#9B59B6] transition-colors"
        )}
      >
        <Plus className="w-3 h-3" />
        Ship Something
      </button>

      {/* Dialog */}
      <ShipLogDialog
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
