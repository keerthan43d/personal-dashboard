"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useStupaStore } from "./stupa-store";
import type { StupaTag } from "@/lib/db/stupa-repository";

const PRESET_COLORS = [
  "#FFD600", "#E60012", "#FFFFFF", "#9B59B6",
  "#2ECC71", "#3498DB", "#FF6B35", "#00BCD4",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-5 h-5 border-2 transition-all flex-shrink-0"
          style={{
            backgroundColor: c,
            borderColor: value === c ? "rgba(255,255,255,0.9)" : "transparent",
          }}
          title={c}
        />
      ))}
      <label className="relative w-5 h-5 cursor-pointer flex-shrink-0 border border-white/20 overflow-hidden" title="Custom colour">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          className="absolute inset-0"
          style={{ backgroundColor: PRESET_COLORS.includes(value) ? "transparent" : value }}
        />
        {PRESET_COLORS.includes(value) && (
          <span className="absolute inset-0 flex items-center justify-center text-white/50 text-[8px]">+</span>
        )}
      </label>
    </div>
  );
}

function EditRow({
  tag,
  onSave,
  onCancel,
}: {
  tag: StupaTag;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  return (
    <div className="flex flex-col gap-2 p-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim(), color)}
        className="w-full bg-white/[0.04] border border-white/10 px-2 py-1 text-[11px] text-white outline-none focus:border-white/30"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-1">
        <button
          onClick={() => name.trim() && onSave(name.trim(), color)}
          className="flex-1 py-1 bg-[#FFD600] text-black flex items-center justify-center"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1 border border-white/15 text-white/50 flex items-center justify-center hover:border-white/30 hover:text-white transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function TagManager() {
  const { tags, addTag, editTag, removeTag } = useStupaStore();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#FFD600");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addTag(newName.trim(), newColor);
      setNewName("");
      setNewColor("#FFD600");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (id: string, name: string, color: string) => {
    await editTag(id, { name, color });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-0 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-0 border-b border-white/8 px-4 py-3">
        <div className="w-0.5 self-stretch bg-[#FFD600] mr-3" />
        <span className="text-[10px] font-black tracking-[0.16em] uppercase text-white">
          TAG MANAGER
        </span>
      </div>

      {/* Create form */}
      <div className="flex flex-col gap-2.5 p-4 border-b border-white/8">
        <input
          type="text"
          placeholder="Tag name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="w-full bg-white/[0.04] border border-white/10 px-3 py-1.5 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-white/30"
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="flex items-center gap-1.5 justify-center py-1.5 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 hover:bg-white transition-colors"
        >
          <Plus className="w-3 h-3" />
          {creating ? "CREATING..." : "CREATE TAG"}
        </button>
      </div>

      {/* Tag list */}
      <div className="flex flex-col gap-0">
        {tags.length === 0 && (
          <p className="px-4 py-6 text-[10px] text-white/25 font-mono">No tags yet.</p>
        )}
        {tags.map((tag) => (
          <div key={tag.id} className="border-b border-white/[0.04]">
            {editingId === tag.id ? (
              <EditRow
                tag={tag}
                onSave={(name, color) => handleSaveEdit(tag.id, name, color)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-2.5 group hover:bg-white/[0.02] transition-colors">
                <span
                  className="w-2 h-2 flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-[11px] text-white font-bold truncate">
                  {tag.name}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(tag.id)}
                    className="text-white/30 hover:text-white transition-colors p-0.5"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="text-white/30 hover:text-[#E60012] transition-colors p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
