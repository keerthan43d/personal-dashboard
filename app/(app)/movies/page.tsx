"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Film, Search, Pencil, Trash2 } from "lucide-react";
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
import { MovieDialog } from "@/components/movies/movie-dialog";
import { useMovies }   from "@/lib/hooks/use-movies";
import { fmt }         from "@/lib/utils/date";
import { cn }          from "@/lib/utils";
import type { Movie }  from "@/lib/db/schemas";

type Tab = "all" | "watched" | "watching" | "watchlist";

export default function MoviesPage() {
  const { movies, loading, load, edit, remove } = useMovies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMovie,  setEditMovie]  = useState<Movie | undefined>();
  const [tab,    setTab]    = useState<Tab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const filtered = movies
    .filter((m) => tab === "all" || m.status === tab)
    .filter((m) => !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.director?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all:       movies.length,
    watched:   movies.filter((m) => m.status === "watched").length,
    watching:  movies.filter((m) => m.status === "watching").length,
    watchlist: movies.filter((m) => m.status === "watchlist").length,
  };

  const avgRating = (() => {
    const rated = movies.filter((m) => m.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, m) => s + m.rating!, 0) / rated.length).toFixed(1);
  })();

  return (
    <>
      <Topbar
        title="Visions"
        subtitle={`${counts.watched} watched · ${counts.watchlist} watchlist${avgRating ? ` · ★ ${avgRating} avg` : ""}`}
        actions={
          <Button onClick={() => setDialogOpen(true)} size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Movie
          </Button>
        }
      />

      <PageShell>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies…" className="pl-9 h-9 bg-white/5 border-white/10 text-sm" />
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
          <EmptyState icon={<Film className="w-6 h-6" />}
            title={search ? "No movies match" : "No movies yet"}
            description={!search ? "Start tracking movies you've watched or want to watch." : undefined}
            action={!search ? (
              <Button onClick={() => setDialogOpen(true)} size="sm"
                className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Movie
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {filtered.map((movie, i) => (
                <motion.div key={movie.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <MovieCard
                    movie={movie}
                    onEdit={() => setEditMovie(movie)}
                    onRemove={async () => {
                      if (!confirm("Remove this movie?")) return;
                      await remove(movie.id);
                      toast.success("Removed");
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageShell>

      <MovieDialog open={dialogOpen || !!editMovie}
        onClose={() => { setDialogOpen(false); setEditMovie(undefined); load(); }}
        existing={editMovie}
      />
    </>
  );
}

function MovieCard({ movie, onEdit, onRemove }: {
  movie: Movie; onEdit: () => void; onRemove: () => void;
}) {
  return (
    <div className={cn(
      "group relative rounded-xl border border-white/6 bg-[#111111] overflow-hidden",
      "hover:border-white/12 hover:-translate-y-1 transition-all duration-200",
      "hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
    )}>
      {/* Hover action buttons */}
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

      <Link href={`/movies/${movie.id}`} className="block cursor-pointer">
        {/* Poster */}
        <div className="relative h-52 bg-[#1a1a1a] overflow-hidden">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />
          <div className="absolute top-2 left-2">
            <StatusBadge status={movie.status} />
          </div>
          {movie.year && (
            <span className="absolute top-2 right-2 text-[10px] text-white/60 font-numeric bg-black/40 px-1.5 py-0.5 rounded">
              {movie.year}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <h3 className="text-xs font-semibold text-[#f5f5f5] leading-snug line-clamp-2 min-h-[2.1rem]">{movie.title}</h3>
          <p className="text-[10px] text-muted-foreground truncate min-h-[0.9rem]">{movie.director}</p>

          <div className="flex items-center justify-between pt-0.5">
            <StarRating value={movie.rating ?? 0} max={10} readonly />
            {movie.runtime && (
              <span className="text-[10px] text-muted-foreground font-numeric">{movie.runtime}m</span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 truncate min-h-[0.9rem]">{movie.genres.slice(0,3).join(" · ")}</p>
        </div>
      </Link>
    </div>
  );
}
