"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, Select, Combo, DialogActions } from "./form-kit";
import { SERVICE_STATUS } from "./marketing-helpers";
import type {
  MktService, MktServiceInput, ServiceStatus, FeeKind,
} from "@/lib/db/marketing-repository";

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  serviceTypes: string[];
  existing?: MktService;
  onSave: (data: MktServiceInput) => Promise<void>;
  onDelete?: () => void;
}

export function ServiceDialog({ open, onClose, clientId, serviceTypes, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MktServiceInput>({
    clientId: existing?.clientId ?? clientId,
    type: existing?.type ?? "",
    status: existing?.status ?? "active",
    startDate: existing?.startDate ?? "",
    endDate: existing?.endDate ?? "",
    fee: existing?.fee ?? null,
    feeKind: existing?.feeKind ?? "monthly",
    description: existing?.description ?? "",
  });

  function set<K extends keyof MktServiceInput>(k: K, v: MktServiceInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.type.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        type: form.type.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        description: form.description?.trim() || null,
        feeKind: form.fee !== null ? form.feeKind : null,
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
            {existing ? "Edit Service" : "Add Service"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Service Type" required>
            <Combo value={form.type} onChange={(v) => set("type", v)} options={serviceTypes}
              placeholder="Google Ads, SEO, Website…  (type a new one to add it)" listId="svc-types" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={(v) => set("status", v as ServiceStatus)}>
                {(Object.keys(SERVICE_STATUS) as ServiceStatus[]).map((s) => (
                  <option key={s} value={s}>{SERVICE_STATUS[s].label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fee (optional)">
              <div className="flex gap-2">
                <Input type="number" min={0} value={form.fee ?? ""}
                  onChange={(e) => set("fee", e.target.value ? Number(e.target.value) : null)}
                  placeholder="—" className={cn(input, "[color-scheme:dark] flex-1")} />
                <select value={form.feeKind ?? "monthly"}
                  onChange={(e) => set("feeKind", e.target.value as FeeKind)}
                  className="h-9 bg-[#111] border border-white/15 text-xs text-white/90 px-1.5 rounded-md focus:outline-none">
                  <option value="monthly">/mo</option>
                  <option value="project">project</option>
                </select>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <Input type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)}
                className={cn(input, "[color-scheme:dark]")} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)}
                className={cn(input, "[color-scheme:dark]")} />
            </Field>
          </div>

          <Field label="Scope / Description">
            <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
              placeholder="What this service covers…" rows={2} className={cn(input, "resize-none")} />
          </Field>
        </div>

        <DialogActions onDelete={onDelete} onClose={onClose} onSave={handleSave}
          disabled={!form.type.trim()} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
