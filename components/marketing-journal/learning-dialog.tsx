"use client";
import { useState } from "react";
import { Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, Select, TagInput, DialogActions } from "./form-kit";
import { LEARNING_TYPE } from "./marketing-helpers";
import type { MktLearning, MktLearningInput, LearningType } from "@/lib/db/marketing-repository";

export type CampaignOption = { id: string; label: string };

interface Props {
  open: boolean;
  onClose: () => void;
  campaignOptions: CampaignOption[];
  tagSuggestions: string[];
  defaultCampaignId?: string;
  existing?: MktLearning;
  onSave: (data: MktLearningInput) => Promise<void>;
  onDelete?: () => void;
}

export function LearningDialog({
  open, onClose, campaignOptions, tagSuggestions, defaultCampaignId, existing, onSave, onDelete,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MktLearningInput>({
    campaignId: existing?.campaignId ?? defaultCampaignId ?? campaignOptions[0]?.id ?? "",
    type: existing?.type ?? "worked",
    lesson: existing?.lesson ?? "",
    tags: existing?.tags ?? [],
    repeat: existing?.repeat ?? false,
  });

  function set<K extends keyof MktLearningInput>(k: K, v: MktLearningInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.lesson.trim() || !form.campaignId) return;
    setSaving(true);
    try {
      await onSave({ ...form, lesson: form.lesson.trim() });
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
            {existing ? "Edit Learning" : "Log a Learning"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Worked / Didn't toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LEARNING_TYPE) as LearningType[]).map((t) => {
              const active = form.type === t;
              const { label, color } = LEARNING_TYPE[t];
              return (
                <button key={t} type="button" onClick={() => set("type", t)}
                  className={cn("h-9 text-[10px] font-black tracking-[0.08em] uppercase border transition-all",
                    !active && "border-white/10 text-white/40 hover:border-white/20")}
                  style={active ? { borderColor: color, color, background: `${color}14` } : undefined}>
                  {label}
                </button>
              );
            })}
          </div>

          <Field label="The Lesson" required>
            <Textarea value={form.lesson} onChange={(e) => set("lesson", e.target.value)}
              autoFocus placeholder="One or two lines — what you learned…" rows={2}
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 resize-none" />
          </Field>

          <Field label="Campaign" required>
            <Select value={form.campaignId} onChange={(v) => set("campaignId", v)}>
              {campaignOptions.length === 0 && <option value="">No campaigns yet — add one first</option>}
              {campaignOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </Field>

          <Field label="Tags">
            <TagInput tags={form.tags} onChange={(t) => set("tags", t)} suggestions={tagSuggestions} />
          </Field>

          <button type="button" onClick={() => set("repeat", !form.repeat)}
            className={cn("flex items-center gap-2 h-9 px-3 border text-[10px] font-black tracking-[0.08em] uppercase transition-all w-full cursor-pointer",
              form.repeat
                ? "border-[#6BD98A] text-[#6BD98A] bg-[#6BD98A]/10"
                : "border-white/10 text-white/40 hover:border-white/20")}>
            <Repeat className="w-3.5 h-3.5" strokeWidth={2.5} />
            Repeat this {form.repeat ? "— flagged" : "?"}
          </button>
        </div>

        <DialogActions onDelete={onDelete} onClose={onClose} onSave={handleSave}
          disabled={!form.lesson.trim() || !form.campaignId} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
