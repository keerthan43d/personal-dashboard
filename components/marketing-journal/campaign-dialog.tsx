"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, Select, DialogActions } from "./form-kit";
import { CAMPAIGN_STATUS, VERDICT } from "./marketing-helpers";
import type {
  MktCampaign, MktCampaignInput, CampaignStatus, Verdict,
} from "@/lib/db/marketing-repository";

export type ServiceOption = { id: string; label: string };

interface Props {
  open: boolean;
  onClose: () => void;
  serviceOptions: ServiceOption[];
  defaultServiceId?: string;
  existing?: MktCampaign;
  onSave: (data: MktCampaignInput) => Promise<void>;
  onDelete?: () => void;
}

const numVal = (v: string) => (v === "" ? null : Number(v));

export function CampaignDialog({
  open, onClose, serviceOptions, defaultServiceId, existing, onSave, onDelete,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MktCampaignInput>({
    serviceId: existing?.serviceId ?? defaultServiceId ?? serviceOptions[0]?.id ?? "",
    name: existing?.name ?? "",
    goal: existing?.goal ?? "",
    startDate: existing?.startDate ?? "",
    endDate: existing?.endDate ?? "",
    status: existing?.status ?? "planning",
    budgetSpent: existing?.budgetSpent ?? null,
    leads: existing?.leads ?? null,
    conversions: existing?.conversions ?? null,
    costPerLead: existing?.costPerLead ?? null,
    reach: existing?.reach ?? null,
    clicks: existing?.clicks ?? null,
    verdict: existing?.verdict ?? null,
  });

  function set<K extends keyof MktCampaignInput>(k: K, v: MktCampaignInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.serviceId) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        goal: form.goal?.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const input = "bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20";
  const numCls = cn(input, "[color-scheme:dark]");
  const metric = (label: string, key: keyof MktCampaignInput) => (
    <Field label={label}>
      <Input type="number" min={0} value={(form[key] as number | null) ?? ""}
        onChange={(e) => set(key, numVal(e.target.value) as MktCampaignInput[typeof key])}
        placeholder="—" className={numCls} />
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#0a0a0a] border border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.12em] uppercase text-white">
            {existing ? "Edit Campaign" : "Add Campaign"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Campaign Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. LASIK Monsoon Push" className={cn(input, "text-white")} />
          </Field>

          <Field label="Service" required>
            <Select value={form.serviceId} onChange={(v) => set("serviceId", v)}>
              {serviceOptions.length === 0 && <option value="">No services yet — add one first</option>}
              {serviceOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </Field>

          <Field label="Goal (plain words)">
            <Textarea value={form.goal ?? ""} onChange={(e) => set("goal", e.target.value)}
              placeholder="What this push is trying to achieve…" rows={2} className={cn(input, "resize-none")} />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={(v) => set("status", v as CampaignStatus)}>
                {(Object.keys(CAMPAIGN_STATUS) as CampaignStatus[]).map((s) => (
                  <option key={s} value={s}>{CAMPAIGN_STATUS[s].label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Start">
              <Input type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)}
                className={numCls} />
            </Field>
            <Field label="End">
              <Input type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)}
                className={numCls} />
            </Field>
          </div>

          {/* Results — all optional; blanks stay blank, never zero */}
          <div className="pt-1">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35 mb-2">
              Results — fill only what applies
            </p>
            <div className="grid grid-cols-3 gap-3">
              {metric("Budget Spent", "budgetSpent")}
              {metric("Leads", "leads")}
              {metric("Conversions", "conversions")}
              {metric("Cost / Lead", "costPerLead")}
              {metric("Reach", "reach")}
              {metric("Clicks", "clicks")}
            </div>
          </div>

          <Field label="Verdict">
            <div className="grid grid-cols-4 gap-2">
              <button type="button" onClick={() => set("verdict", null)}
                className={cn("h-8 text-[9px] font-black tracking-[0.06em] uppercase border transition-all",
                  form.verdict === null ? "border-white/40 text-white" : "border-white/10 text-white/40 hover:border-white/20")}>
                None
              </button>
              {(Object.keys(VERDICT) as Verdict[]).map((v) => {
                const active = form.verdict === v;
                return (
                  <button key={v} type="button" onClick={() => set("verdict", v)}
                    className={cn("h-8 text-[9px] font-black tracking-[0.06em] uppercase border transition-all",
                      !active && "border-white/10 text-white/40 hover:border-white/20")}
                    style={active ? { borderColor: VERDICT[v].color, color: VERDICT[v].color } : undefined}>
                    {VERDICT[v].label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <DialogActions onDelete={onDelete} onClose={onClose} onSave={handleSave}
          disabled={!form.name.trim() || !form.serviceId} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
