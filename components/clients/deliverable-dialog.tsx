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
import { fmt } from "@/lib/utils/date";
import { DELIVERABLE_TYPE_LABELS } from "@/lib/utils/format";
import type { Project } from "@/lib/db/schemas";

interface DeliverableDialogProps {
  open:     boolean;
  onClose:  () => void;
  clientId: string;
  projects: Project[];
}

export function DeliverableDialog({ open, onClose, clientId, projects }: DeliverableDialogProps) {
  const { addDeliverable } = useClients();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    projectId:   "",
    title:       "",
    type:        "other",
    url:         "",
    deliveredAt: fmt.iso(new Date()),
    notes:       "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await addDeliverable({
        clientId,
        projectId:   form.projectId || undefined,
        title:       form.title.trim(),
        type:        form.type as any,
        url:         form.url.trim() || undefined,
        deliveredAt: form.deliveredAt,
        notes:       form.notes.trim() || undefined,
      });
      toast.success("Deliverable added");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#161616] border-white/10 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Add Deliverable</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={form.title} onChange={set("title")} placeholder="Final Logo Files"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {Object.entries(DELIVERABLE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Delivered On</Label>
              <Input value={form.deliveredAt} onChange={set("deliveredAt")} type="date"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 [color-scheme:dark]" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue placeholder="Link to project (optional)" /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="none">— No project —</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL / Drive Link</Label>
              <Input value={form.url} onChange={set("url")} type="url" placeholder="https://…"
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={2}
                className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 resize-none text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim()}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em]">
              {saving ? "Saving…" : "Add Deliverable"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
