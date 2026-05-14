"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tv, Search, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Topbar }      from "@/components/layout/topbar";
import { PageShell }   from "@/components/shared/page-shell";
import { EmptyState }  from "@/components/shared/empty-state";
import { StarRating }  from "@/components/shared/star-rating";
import { StatusBadge } from "@/components/shared/status-badge";
import { TvShowDialog } from "@/components/tv-shows/tv-show-dialog";
import { useTvShows }   from "@/lib/hooks/use-tv-shows";
import { cn }          from "@/lib/utils";
import type { TvShow }  from "@/lib/db/schemas";

type Tab = "all" | "watched" | "watching" | "watchlist";

export default function TvShowsPage() {
  const { shows, loading, load, edit, remove } = useTvShows();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editShow,   setEditShow]   = useState<TvShow | undefined>();
  const [tab,    setTab]    = useState<Tab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const filtered = shows
    .filter((s) => tab === "all" || s.status === tab)
    .filter((s) => !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.creator?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all:       shows.length,
    watched:   shows.filter((s) => s.status === "watched").length,
    watching:  shows.filter((s) => s.status === "watching").length,
    watchlist: shows.filter((s) => s.status === "watchlist").length,
  };

  const avgRating = (() => {
    const rated = shows.filter((s) => s.rating);
    if (!rated.length) return null;
    return (rated.reduce((sum, s) => sum + s.rating!, 0) / rated.length).toFixed(1);
  })();

  return (
    <>
      <Topbar
        title="TV Shows"
        subtitle={`${counts.watched} watched · ${counts.watchlist} watchlist${avgRating ? ` · ★ ${avgRating} avg` : ""}`}
        actions={
          <Button onClick={() => setDialogOpen(true)} size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Show
          </Button>
        }
      />

      <PageShell>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shows…" className="pl-9 h-9 bg-white/5 border-white/10 text-sm" />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-white/5 border border-white/8 h-9">
              {(["all","watched","watching","watchlist"] as Tab[]).map((t) => (
                <TabsTrigger key={t} value={t}
                  className="text-xs capitalize data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#f5f5f5]">
                  {t} {counts[t] > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({counts[t]})</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-72 rounded-xl skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Tv className="w-6 h-6" />}
            title={search ? "No shows match" : "No TV shows yet"}
            description={!search ? "Start tracking shows you've watched or want to watch." : undefined}
            action={!search ? (
              <Button onClick={() => setDialogOpen(true)} size="sm"
                className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Show
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {filtered.map((show, i) => (
                <motion.div key={show.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <ShowCard
                    show={show}
                    onEdit={() => setEditShow(show)}
                    onRemove={async () => {
                      if (!confirm("Remove this show?")) return;
                      await remove(show.id);
                      toast.success("Removed");
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageShell>

      <TvShowDialog open={dialogOpen || !!editShow}
        onClose={() => { setDialogOpen(false); setEditShow(undefined); load(); }}
        existing={editShow}
      />
    </>
  );
}

function ShowCard({ show, onEdit, onRemove }: {
  show: TvShow; onEdit: () => void; onRemove: () => void;
}) {
  return (
    <div className={cn(
      "group relative rounded-xl border border-white/6 bg-[#111111] overflow-hidden",
      "hover:border-white/12 hover:-translate-y-1 transition-[transform,border-color,box-shadow] duration-200",
      "hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
    )}>
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="w-6 h-6 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#FFD600]/10 transition-colors">
          <Pencil className="w-3 h-3 text-white/70" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="w-6 h-6 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-rose-500/20 transition-colors">
          <Trash2 className="w-3 h-3 text-white/70" />
        </button>
      </div>

      <Link href={`/tv-shows/${show.id}`} className="block cursor-pointer">
        <div className="relative h-52 bg-[#1a1a1a] overflow-hidden">
          {show.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.posterUrl} alt={show.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />
          <div className="absolute top-2 left-2">
            <StatusBadge status={show.status} />
          </div>
          {show.year && (
            <span className="absolute top-2 right-2 text-[10px] text-white/60 font-numeric bg-black/40 px-1.5 py-0.5 rounded">
              {show.year}
            </span>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          <h3 className="text-xs font-semibold text-[#f5f5f5] leading-snug line-clamp-2">{show.title}</h3>
          {show.creator && <p className="text-[10px] text-muted-foreground truncate">{show.creator}</p>}

          <div className="flex items-center justify-between pt-0.5">
            <StarRating value={show.rating ?? 0} readonly />
            {show.seasons && (
              <span className="text-[10px] text-muted-foreground font-numeric">{show.seasons}S</span>
            )}
          </div>

          {show.genres.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 truncate">{show.genres.slice(0,3).join(" · ")}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
