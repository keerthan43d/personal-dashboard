"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/shared/star-rating";
import { useBooks } from "@/lib/hooks/use-books";
import type { Book } from "@/lib/db/schemas";

interface BookDialogProps {
  open:      boolean;
  onClose:   () => void;
  existing?: Book;
}

export function BookDialog({ open, onClose, existing }: BookDialogProps) {
  const { add, edit } = useBooks();
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    title:      existing?.title      ?? "",
    author:     existing?.author     ?? "",
    coverUrl:   existing?.coverUrl   ?? "",
    isbn:       existing?.isbn       ?? "",
    genre:      existing?.genre      ?? "",
    status:     existing?.status     ?? "wishlist",
    rating:     existing?.rating     ?? 0,
    startedAt:  existing?.startedAt  ?? "",
    finishedAt: existing?.finishedAt ?? "",
    notes:      existing?.notes      ?? "",
    pages:      existing?.pages?.toString() ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /** Open Library cover lookup */
  async function lookupCover() {
    const q = form.isbn.trim() || form.title.trim();
    if (!q) return;
    setSearching(true);
    try {
      const url = form.isbn
        ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(form.isbn)}-L.jpg`
        : `https://covers.openlibrary.org/b/olid/${ await getOLID(form.title, form.author) }-L.jpg`;
      setForm((f) => ({ ...f, coverUrl: url }));
      toast.success("Cover found");
    } catch {
      toast.error("Cover not found — try adding an ISBN");
    } finally {
      setSearching(false);
    }
  }

  async function getOLID(title: string, author: string): Promise<string> {
    const res  = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`);
    const data = await res.json();
    const key  = data.docs?.[0]?.cover_edition_key ?? data.docs?.[0]?.edition_key?.[0];
    if (!key) throw new Error("not found");
    return key;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setSaving(true);
    try {
      const data = {
        title:      form.title.trim(),
        author:     form.author.trim(),
        coverUrl:   form.coverUrl.trim() || undefined,
        isbn:       form.isbn.trim()    || undefined,
        genre:      form.genre.trim()   || undefined,
        status:     form.status as Book["status"],
        rating:     form.rating || undefined,
        takeaways:  existing?.takeaways ?? [],
        startedAt:  form.startedAt  || undefined,
        finishedAt: form.finishedAt || undefined,
        notes:      form.notes.trim() || undefined,
        pages:      form.pages ? parseInt(form.pages) : undefined,
      };
      if (existing) {
        await edit(existing.id, data);
        toast.success("Book updated");
      } else {
        await add(data);
        toast.success("Book added to library");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#161616] border-white/10 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {existing ? "Edit Book" : "Add to Library"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="flex gap-4">
            {/* Cover preview */}
            <div className="flex-shrink-0">
              <div className="w-16 h-24 rounded-lg border border-white/10 bg-white/4 overflow-hidden flex items-center justify-center">
                {form.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted-foreground text-center px-1">No cover</span>
                )}
              </div>
            </div>

            {/* Main fields */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={form.title} onChange={set("title")} placeholder="Atomic Habits"
                  className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Author *</Label>
                <Input value={form.author} onChange={set("author")} placeholder="James Clear"
                  className="bg-white/5 border-white/10 focus:border-[#FFD600]/40" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Book["status"] }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {["wishlist","reading","finished","dnf"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rating</Label>
              <div className="h-9 flex items-center">
                <StarRating value={form.rating} size="md" onRate={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>
            </div>

            {(form.status === "reading" || form.status === "finished") && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Started</Label>
                <Input value={form.startedAt} onChange={set("startedAt")} type="date"
                  className="bg-white/5 border-white/10 [color-scheme:dark] h-9" />
              </div>
            )}
            {form.status === "finished" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Finished</Label>
                <Input value={form.finishedAt} onChange={set("finishedAt")} type="date"
                  className="bg-white/5 border-white/10 [color-scheme:dark] h-9" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Genre</Label>
              <Input value={form.genre} onChange={set("genre")} placeholder="Non-fiction"
                className="bg-white/5 border-white/10 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pages</Label>
              <Input value={form.pages} onChange={set("pages")} type="number" placeholder="320"
                className="bg-white/5 border-white/10 h-9" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">ISBN (for auto cover)</Label>
              <div className="flex gap-2">
                <Input value={form.isbn} onChange={set("isbn")} placeholder="9780735211292"
                  className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 flex-1 h-9" />
                <Button type="button" variant="outline" size="sm" onClick={lookupCover} disabled={searching}
                  className="border-white/10 bg-white/5 hover:bg-white/8 text-[#d4d4d8] h-9 gap-1.5 flex-shrink-0">
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Cover
                </Button>
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cover URL (manual)</Label>
              <Input value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://…"
                className="bg-white/5 border-white/10 h-9" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={2}
                className="bg-white/5 border-white/10 resize-none text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.author.trim()}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em]">
              {saving ? "Saving…" : existing ? "Save Changes" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
