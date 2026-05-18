"use client";
import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProblemLog, ProblemLogInput } from "@/lib/db/schemas";

interface Props {
  open:      boolean;
  onClose:   () => void;
  entryDate: string;
  existing?: ProblemLog;
  onSave:    (data: ProblemLogInput) => Promise<void>;
  onDelete?: () => void;
}

const FIELDS: { key: keyof ProblemLogInput; label: string; rows?: number; required?: boolean; placeholder: string }[] = [
  { key: "whatTheProblemWas", label: "What was the problem?",    rows: 3, placeholder: "Describe it plainly…" },
  { key: "context",           label: "Context",                  rows: 2, placeholder: "Client, tool, project, environment…" },
  { key: "whatDidntWork",     label: "What didn't work",         rows: 3, placeholder: "Dead ends, failed attempts…" },
  { key: "whatSolvedIt",      label: "What actually solved it",  rows: 3, placeholder: "The fix…" },
  { key: "whyItWorked",       label: "Why it worked",            rows: 2, placeholder: "The root cause or insight…" },
];

export function ProblemDialog({ open, onClose, entryDate, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProblemLogInput>>({
    title:              existing?.title              ?? "",
    whatTheProblemWas:  existing?.whatTheProblemWas  ?? "",
    context:            existing?.context            ?? "",
    whatDidntWork:      existing?.whatDidntWork      ?? "",
    whatSolvedIt:       existing?.whatSolvedIt       ?? "",
    whyItWorked:        existing?.whyItWorked        ?? "",
    tags:               existing?.tags               ?? [],
    entryDate,
  });
  const [tagInput, setTagInput] = useState("");

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !form.tags?.includes(t)) {
      setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((t) => t !== tag) }));
  }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      await onSave({
        entryDate,
        title:             form.title!.trim(),
        whatTheProblemWas: form.whatTheProblemWas || undefined,
        context:           form.context           || undefined,
        whatDidntWork:     form.whatDidntWork      || undefined,
        whatSolvedIt:      form.whatSolvedIt       || undefined,
        whyItWorked:       form.whyItWorked        || undefined,
        tags:              form.tags ?? [],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#0a0a0a] border border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.12em] uppercase text-white">
            {existing ? "Edit Problem" : "Log Problem"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/40">
              Title <span className="text-rose-400">*</span>
            </label>
            <Input
              value={form.title ?? ""}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="One line: what was the problem?"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
            />
          </div>

          {/* Other fields */}
          {FIELDS.map(({ key, label, rows = 3, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/40">
                {label}
              </label>
              <Textarea
                value={(form[key] as string) ?? ""}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none focus-visible:ring-[#FFD600]/30"
              />
            </div>
          ))}

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/40">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags ?? []).map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black tracking-[0.08em] uppercase border border-white/15 text-white/50"
                >
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-rose-400 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
              }}
              placeholder="Type a tag + Enter (e.g. hostinger, react, client-zorum)"
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className={cn("flex gap-3 mt-4 pt-4 border-t border-white/8", onDelete && "justify-between")}>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-[10px] font-black tracking-[0.08em] uppercase"
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/40 hover:text-white/60 text-[10px] font-black tracking-[0.08em] uppercase"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!form.title?.trim() || saving}
              className="bg-[#FFD600] text-black hover:bg-[#FFD600]/90 font-black text-[10px] tracking-[0.08em] uppercase"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
