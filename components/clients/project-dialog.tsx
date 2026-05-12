"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";
import type { Project } from "@/lib/db/schemas";

interface ProjectDialogProps {
  open:      boolean;
  onClose:   () => void;
  clientId:  string;
  existing?: Project;
}

export function ProjectDialog({ open, onClose, clientId, existing }: ProjectDialogProps) {
  const { addProject, editProject } = useClients();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title:         existing?.title         ?? "",
    description:   existing?.description   ?? "",
    status:        existing?.status        ?? "active",
    deadline:      existing?.deadline      ?? "",
    paymentAmount: existing?.paymentAmount?.toString() ?? "",
    paymentStatus: existing?.paymentStatus ?? "unpaid",
    notes:         existing?.notes         ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        clientId,
        title:         form.title.trim(),
        description:   form.description.trim() || undefined,
        status:        form.status as Project["status"],
        deadline:      form.deadline || undefined,
        paymentAmount: form.paymentAmount ? parseFloat(form.paymentAmount) : undefined,
        paymentStatus: form.paymentStatus as Project["paymentStatus"],
        notes:         form.notes.trim() || undefined,
      };
      if (existing) {
        await editProject(existing.id, data);
        toast.success("Project updated");
      } else {
        await addProject(data);
        toast.success("Project created");
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
            {existing ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project Title *</Label>
              <Input value={form.title} onChange={set("title")} placeholder="Brand Identity Package"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={set("description")} rows={2}
                placeholder="What's included…"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 resize-none text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Project["status"] }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {["active","review","blocked","done"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deadline</Label>
              <Input value={form.deadline} onChange={set("deadline")} type="date"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 [color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment ($)</Label>
              <Input value={form.paymentAmount} onChange={set("paymentAmount")} type="number" placeholder="1500"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm((f) => ({ ...f, paymentStatus: v as Project["paymentStatus"] }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {["unpaid","partial","paid"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Any notes…"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 resize-none text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim()}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em]">
              {saving ? "Saving…" : existing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
