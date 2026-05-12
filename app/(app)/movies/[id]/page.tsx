"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Pencil, Trash2, Film, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button }   from "@/components/ui/button";
import { Topbar }   from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { StarRating } from "@/components/shared/star-rating";
import { StatusBadge } from "@/components/shared/status-badge";
import { MovieDialog } from "@/components/movies/movie-dialog";
import { useMovies }   from "@/lib/hooks/use-movies";
import { repo }        from "@/lib/db";
import { fmt }         from "@/lib/utils/date";
import type { Movie }  from "@/lib/db/schemas";

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const { edit, remove } = useMovies();
  const [movie, setMovie]   = useState<Movie | undefined>();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { repo.getMovie(id).then(setMovie); }, [id]);
  const reload = () => repo.getMovie(id).then(setMovie);

  if (!movie) return (
    <PageShell><p className="text-muted-foreground text-sm">Movie not found.</p></PageShell>
  );

  async function handleDelete() {
    if (!confirm("Remove this movie?")) return;
    await remove(id);
    toast.success("Removed");
    router.push("/movies");
  }

  return (
    <>
      <Topbar title={movie.title} subtitle={movie.director ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/movies")}
              className="text-muted-foreground h-8 gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">Back</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500/70 hover:text-rose-400"
              onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      />

      <PageShell>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex gap-6 mb-8">
              {/* Poster */}
              <div className="flex-shrink-0 w-28 h-40 rounded-xl border border-white/10 overflow-hidden bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {movie.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="font-display text-2xl font-semibold text-[#f5f5f5] leading-tight mb-1">{movie.title}</h1>
                <p className="text-muted-foreground mb-3">{movie.director} {movie.year && `· ${movie.year}`}</p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <StatusBadge status={movie.status} />
                  {movie.genres.map((g) => (
                    <span key={g} className="text-xs text-muted-foreground border border-white/10 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>

                <StarRating value={movie.rating ?? 0} size="md" onRate={async (n) => { await edit(movie.id, { rating: n }); reload(); }} />

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {movie.runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {movie.runtime} min
                    </span>
                  )}
                  {movie.watchedAt && <span>Watched {fmt.date(movie.watchedAt)}</span>}
                </div>
              </div>
            </div>

            {movie.notes && (
              <div className="p-5 rounded-xl border border-white/6 bg-[#111111]">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Craft Notes</p>
                <p className="text-sm text-[#d4d4d8] leading-relaxed">{movie.notes}</p>
              </div>
            )}
          </motion.div>
        </div>
      </PageShell>

      <MovieDialog open={editOpen} onClose={() => { setEditOpen(false); reload(); }} existing={movie} />
    </>
  );
}
