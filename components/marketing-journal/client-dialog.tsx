"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, Select, DialogActions } from "./form-kit";
import { CLIENT_STATUS } from "./marketing-helpers";
import type { MktClient, MktClientInput, ClientStatus } from "@/lib/db/marketing-repository";

const SWATCHES = ["#FFD600", "#6BD98A", "#4F9DFF", "#E60012", "#9B59B6", "#FF8A3D", "#E8E8E8"];

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: MktClient;
  onSave: (data: MktClientInput) => Promise<void>;
  onDelete?: () => void;
}

export function ClientDialog({ open, onClose, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MktClientInput>({
    name: existing?.name ?? "",
    industry: existing?.industry ?? "",
    city: existing?.city ?? "",
    color: existing?.color ?? "#FFD600",
    logoUrl: existing?.logoUrl ?? "",
    status: existing?.status ?? "active",
    contact: existing?.contact ?? "",
    website: existing?.website ?? "",
    startedAt: existing?.startedAt ?? format(new Date(), "yyyy-MM-dd"),
    notes: existing?.notes ?? "",
  });

  function set<K extends keyof MktClientInput>(k: K, v: MktClientInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        industry: form.industry?.trim() || null,
        city: form.city?.trim() || null,
        contact: form.contact?.trim() || null,
        website: form.website?.trim() || null,
        notes: form.notes?.trim() || null,
        logoUrl: form.logoUrl?.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const input = "bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#0a0a0a] border border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.12em] uppercase text-white">
            {existing ? "Edit Client" : "Add Client"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Client Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dr. Solanki Eye Hospital" className={cn(input, "text-white")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)}
                placeholder="Healthcare" className={input} />
            </Field>
            <Field label="City">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)}
                placeholder="Mysore" className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={(v) => set("status", v as ClientStatus)}>
                {(Object.keys(CLIENT_STATUS) as ClientStatus[]).map((s) => (
                  <option key={s} value={s}>{CLIENT_STATUS[s].label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Working Since">
              <Input type="date" value={form.startedAt ?? ""} onChange={(e) => set("startedAt", e.target.value)}
                className={cn(input, "[color-scheme:dark]")} />
            </Field>
          </div>

          <Field label="Accent Colour">
            <div className="flex items-center gap-2">
              {SWATCHES.map((c) => (
                <button key={c} type="button" onClick={() => set("color", c)}
                  className={cn("w-6 h-6 rounded-full border-2 transition-transform cursor-pointer",
                    form.color === c ? "scale-110" : "border-transparent hover:scale-105")}
                  style={{ background: c, borderColor: form.color === c ? "#fff" : "transparent" }} />
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Main Contact">
              <Input value={form.contact ?? ""} onChange={(e) => set("contact", e.target.value)}
                placeholder="Person you deal with" className={input} />
            </Field>
            <Field label="Website">
              <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)}
                placeholder="https://…" className={input} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
              placeholder="What they want, quirks, context to remember…" rows={2}
              className={cn(input, "resize-none")} />
          </Field>
        </div>

        <DialogActions onDelete={onDelete} onClose={onClose} onSave={handleSave}
          disabled={!form.name.trim()} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
