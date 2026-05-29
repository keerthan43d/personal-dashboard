"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge }    from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { useMovies } from "@/lib/hooks/use-movies";
import { fmt }       from "@/lib/utils/date";
import type { Movie } from "@/lib/db/schemas";

const GENRES = ["Action","Animation","Comedy","Crime","Documentary","Drama","Fantasy","Horror","Mystery","Romance","Sci-Fi","Thriller","Western"];

interface MovieDialogProps {
  open:      boolean;
  onClose:   () => void;
  existing?: Movie;
}

export function MovieDialog({ open, onClose, existing }: MovieDialogProps) {
  const { add, edit } = useMovies();
  const [saving, setSaving]     = useState(false);
  const [searching, setSearching] = useState(false);

  const buildForm = () => ({
    title:     existing?.title     ?? "",
    director:  existing?.director  ?? "",
    year:      existing?.year?.toString()     ?? "",
    posterUrl: existing?.posterUrl ?? "",
    status:    existing?.status    ?? "watchlist",
    rating:    existing?.rating    ?? 0,
    notes:     existing?.notes     ?? "",
    watchedAt: existing?.watchedAt ?? "",
    runtime:   existing?.runtime?.toString()  ?? "",
    genres:    existing?.genres    ?? [] as string[],
  });
  const [form, setForm] = useState(buildForm);

  // Reset form each time the dialog opens so a fresh "Add" is empty and
  // "Edit" loads the selected item (the dialog stays mounted between opens).
  useEffect(() => {
    if (open) setForm(buildForm());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function toggleGenre(g: string) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  }

  /** TMDB search for poster (no key required for image fallback) */
  async function searchTMDB() {
    if (!form.title.trim()) return;
    setSearching(true);
    try {
      // Public TMDB search (no API key — uses the public-facing image search)
      // If user sets NEXT_PUBLIC_TMDB_KEY we use it; otherwise degrade gracefully
      const key = process.env.NEXT_PUBLIC_TMDB_KEY;
      if (!key) {
        toast.info("Add NEXT_PUBLIC_TMDB_KEY to .env.local for auto posters. Using title search fallback.");
        setSearching(false);
        return;
      }
      const res  = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(form.title)}&year=${form.year}`
      );
      const data = await res.json();
      const hit  = data.results?.[0];
      if (!hit) { toast.error("Movie not found on TMDB"); return; }
      setForm((f) => ({
        ...f,
        posterUrl: hit.poster_path ? `https://image.tmdb.org/t/p/w500${hit.poster_path}` : f.posterUrl,
        year:      hit.release_date?.split("-")[0] ?? f.year,
        genres:    f.genres.length ? f.genres : [],
      }));
      toast.success("Poster loaded");
    } catch {
      toast.error("TMDB lookup failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title:     form.title.trim(),
        director:  form.director.trim() || undefined,
        year:      form.year ? parseInt(form.year) : undefined,
        posterUrl: form.posterUrl.trim() || undefined,
        status:    form.status as Movie["status"],
        rating:    form.rating || undefined,
        notes:     form.notes.trim() || undefined,
        watchedAt: form.watchedAt || undefined,
        runtime:   form.runtime ? parseInt(form.runtime) : undefined,
        genres:    form.genres,
      };
      if (existing) {
        await edit(existing.id, data);
        toast.success("Movie updated");
      } else {
        await add(data);
        toast.success("Added to Visions");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#161616] border-white/10 text-foreground max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {existing ? "Edit Movie" : "Add to Visions"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-1">
          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div className="flex gap-4">
            {/* Poster preview */}
            <div className="flex-shrink-0 w-16 h-24 rounded-lg border border-white/10 bg-white/4 overflow-hidden flex items-center justify-center">
              {form.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.posterUrl} alt="poster" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-muted-foreground text-center px-1">No poster</span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <div className="flex gap-2">
                  <Input value={form.title} onChange={set("title")} placeholder="Dune: Part Two"
                    className="bg-white/5 border-white/10 focus:border-[#FFD600]/40 flex-1 h-9" required />
                  <Button type="button" variant="outline" size="sm" onClick={searchTMDB} disabled={searching}
                    className="border-white/10 bg-white/5 hover:bg-white/8 text-[#d4d4d8] h-9 gap-1 flex-shrink-0">
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Director</Label>
                <Input value={form.director} onChange={set("director")} placeholder="Denis Villeneuve"
                  className="bg-white/5 border-white/10 h-9" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Movie["status"] }))}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {["watchlist","watching","watched"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rating</Label>
              <div className="h-9 flex items-center">
                <StarRating value={form.rating} max={10} size="md" onRate={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Input value={form.year} onChange={set("year")} type="number" placeholder="2024"
                className="bg-white/5 border-white/10 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Runtime (min)</Label>
              <Input value={form.runtime} onChange={set("runtime")} type="number" placeholder="166"
                className="bg-white/5 border-white/10 h-9" />
            </div>

            {form.status === "watched" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Watched On</Label>
                <Input value={form.watchedAt} onChange={set("watchedAt")} type="date"
                  className="bg-white/5 border-white/10 [color-scheme:dark] h-9" />
              </div>
            )}

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Poster URL (manual)</Label>
              <Input value={form.posterUrl} onChange={set("posterUrl")} placeholder="https://…"
                className="bg-white/5 border-white/10 h-9" />
            </div>

            {/* Genres */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Genres</Label>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <button key={g} type="button" onClick={() => toggleGenre(g)}
                    className={`px-2.5 py-0.5 rounded-full text-xs border cursor-pointer transition-all ${
                      form.genres.includes(g)
                        ? "bg-[#FFD600]/10 border-[#FFD600]/35 text-[#FFD600]"
                        : "bg-white/4 border-white/10 text-muted-foreground hover:border-white/20"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes / Craft observations</Label>
              <Textarea value={form.notes} onChange={set("notes")} rows={2}
                className="bg-white/5 border-white/10 resize-none text-sm" />
            </div>
          </div>

          </div>
          <DialogFooter className="gap-2 pt-3 border-t border-white/8 mt-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim()}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em]">
              {saving ? "Saving…" : existing ? "Save Changes" : "Add Movie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
