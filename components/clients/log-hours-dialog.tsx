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
import type { Project } from "@/lib/db/schemas";

interface LogHoursDialogProps {
  open:     boolean;
  onClose:  () => void;
  clientId: string;
  projects: Project[];
}

export function LogHoursDialog({ open, onClose, clientId, projects }: LogHoursDialogProps) {
  const { addTimeLog } = useClients();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    projectId:   "",
    date:        fmt.iso(new Date()),
    hours:       "",
    description: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hrs = parseFloat(form.hours);
    if (!hrs || hrs <= 0 || hrs > 24) return;
    setSaving(true);
    try {
      await addTimeLog({
        clientId,
        projectId:   form.projectId || undefined,
        date:        form.date,
        hours:       hrs,
        description: form.description.trim() || undefined,
      });
      toast.success(`${hrs}h logged`);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#161616] border-white/10 text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Log Hours</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project (optional)</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue placeholder="Select project…" /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="none">— No project —</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date *</Label>
                <Input value={form.date} onChange={set("date")} type="date"
                  className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50 [color-scheme:dark]" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hours *</Label>
                <Input value={form.hours} onChange={set("hours")} type="number" step="0.25"
                  min="0.25" max="24" placeholder="2.5"
                  className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={set("description")} rows={2}
                placeholder="What did you work on?"
                className="bg-white/5 border-white/10 focus:border-[#06b6d4]/50 resize-none text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
            <Button type="submit" disabled={saving || !form.hours}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-black font-semibold">
              {saving ? "Saving…" : "Log Hours"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
