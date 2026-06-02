"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStupaStore } from "./stupa-store";
import { TagChip } from "./tag-chip";

type Props = { open: boolean; onClose: () => void };

export function AddThoughtDialog({ open, onClose }: Props) {
  const { tags, addThought } = useStupaStore();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setContent("");
      setSelectedTags([]);
    }
  }, [open]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addThought(content.trim(), selectedTags);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#080808] border border-white/10 text-white max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-white/8">
          <DialogTitle className="text-[12px] font-black tracking-[0.14em] uppercase text-white">
            ADD REFLECTION
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
              REFLECTION
            </label>
            <textarea
              placeholder="Write what moves you — thoughts, lessons, realizations..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/25 outline-none focus:border-white/30 resize-none"
            />
          </div>

          {tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
                TAGS
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <TagChip
                    key={t.id}
                    name={t.name}
                    color={t.color}
                    active={selectedTags.includes(t.id)}
                    onClick={() => toggleTag(t.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-0 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white hover:bg-white/[0.03] transition-all border-r border-white/8"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex-1 py-3 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 hover:bg-white transition-colors"
          >
            {saving ? "SAVING..." : "SAVE REFLECTION"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
