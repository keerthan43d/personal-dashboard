"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";
import type { Client } from "@/lib/db/schemas";

interface ClientDialogProps {
  open:       boolean;
  onClose:    () => void;
  existing?:  Client;
}

export function ClientDialog({ open, onClose, existing }: ClientDialogProps) {
  const { addClient, editClient } = useClients();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name:        existing?.name        ?? "",
    company:     existing?.company     ?? "",
    email:       existing?.email       ?? "",
    status:      existing?.status      ?? "active",
    hourlyRate:  existing?.hourlyRate?.toString() ?? "",
    currency:    existing?.currency    ?? "INR",
    notes:       existing?.notes       ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name:       form.name.trim(),
        company:    form.company.trim() || undefined,
        email:      form.email.trim() || undefined,
        status:     form.status as Client["status"],
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        currency:   form.currency,
        notes:      form.notes.trim() || undefined,
      };
      if (existing) {
        await editClient(existing.id, data);
        toast.success("Client updated");
      } else {
        await addClient(data);
        toast.success("Client added");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#161616] border-white/10 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {existing ? "Edit Client" : "New Client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="Arjun Mehta"
                className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company</Label>
              <Input value={form.company} onChange={set("company")} placeholder="Aura Studio"
                className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={form.email} onChange={set("email")} type="email" placeholder="hello@…"
                className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Client["status"] }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {["active","paused","done","archived"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
              <div className="flex gap-1.5">
                <Input value={form.hourlyRate} onChange={set("hourlyRate")} type="number" placeholder="75"
                  className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50 w-full" />
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 w-20 h-9 flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {["USD","EUR","INR","GBP"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={3} placeholder="Any context…"
                className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50 resize-none text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-black font-semibold">
              {saving ? "Saving…" : existing ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
