"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Pencil, Trash2, Plus, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button }   from "@/components/ui/button";
import { Topbar }   from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { StarRating } from "@/components/shared/star-rating";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookDialog } from "@/components/books/book-dialog";
import { useBooks }   from "@/lib/hooks/use-books";
import { repo }       from "@/lib/db";
import { fmt }        from "@/lib/utils/date";
import { cn }         from "@/lib/utils";
import type { Book }  from "@/lib/db/schemas";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const { edit, remove } = useBooks();
  const [book, setBook]  = useState<Book | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const [newTakeaway, setNewTakeaway] = useState("");
  const [addingTakeaway, setAddingTakeaway] = useState(false);

  useEffect(() => { repo.getBook(id).then(setBook); }, [id]);

  const reload = () => repo.getBook(id).then(setBook);

  if (!book) return (
    <PageShell><p className="text-muted-foreground text-sm">Book not found.</p></PageShell>
  );

  async function handleRate(n: number) {
    await edit(book!.id, { rating: n });
    reload();
  }

  async function addTakeaway() {
    if (!newTakeaway.trim()) return;
    await edit(book!.id, { takeaways: [...(book!.takeaways), newTakeaway.trim()] });
    setNewTakeaway(""); setAddingTakeaway(false);
    toast.success("Takeaway added");
    reload();
  }

  async function removeTakeaway(idx: number) {
    const updated = book!.takeaways.filter((_, i) => i !== idx);
    await edit(book!.id, { takeaways: updated });
    reload();
  }

  async function handleDelete() {
    if (!confirm("Remove this book from your library?")) return;
    await remove(id);
    toast.success("Book removed");
    router.push("/books");
  }

  return (
    <>
      <Topbar
        title={book.title}
        subtitle={book.author}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/books")}
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
            {/* Book header */}
            <div className="flex gap-6 mb-8">
              <div className="flex-shrink-0 w-28 h-40 rounded-xl border border-white/10 overflow-hidden bg-[#1a1a1a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="font-display text-2xl font-semibold text-[#f5f5f5] leading-tight mb-1">
                  {book.title}
                </h1>
                <p className="text-muted-foreground mb-3">{book.author}</p>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <StatusBadge status={book.status} />
                  {book.genre && (
                    <span className="text-xs text-muted-foreground border border-white/10 px-2 py-0.5 rounded-full">
                      {book.genre}
                    </span>
                  )}
                  {book.pages && (
                    <span className="text-xs text-muted-foreground">{book.pages} pages</span>
                  )}
                </div>

                <StarRating value={book.rating ?? 0} size="md" onRate={handleRate} />

                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {book.startedAt  && <span>Started {fmt.date(book.startedAt)}</span>}
                  {book.finishedAt && <span>Finished {fmt.date(book.finishedAt)}</span>}
                </div>
              </div>
            </div>

            {/* Notes */}
            {book.notes && (
              <div className="mb-6 p-4 rounded-xl border border-white/6 bg-[#111111]">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-[#d4d4d8] leading-relaxed">{book.notes}</p>
              </div>
            )}

            {/* Takeaways */}
            <div className="rounded-xl border border-white/6 bg-[#111111] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-[#f5f5f5]">
                  Takeaways
                  {book.takeaways.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal font-sans">
                      {book.takeaways.length}
                    </span>
                  )}
                </h3>
                <Button onClick={() => setAddingTakeaway(true)} variant="ghost" size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {book.takeaways.map((t, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/8"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-numeric text-[#FFD600] font-medium">{i+1}</span>
                      </div>
                      <p className="text-sm text-[#d4d4d8] flex-1 leading-relaxed">{t}</p>
                      <button onClick={() => removeTakeaway(i)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-rose-400 transition-all cursor-pointer flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add takeaway inline */}
                {addingTakeaway && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/4 border border-[#FFD600]/15">
                    <div className="w-5 h-5 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-numeric text-[#FFD600] font-medium">{book.takeaways.length + 1}</span>
                    </div>
                    <textarea
                      autoFocus
                      value={newTakeaway}
                      onChange={(e) => setNewTakeaway(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTakeaway(); }
                        if (e.key === "Escape") { setAddingTakeaway(false); setNewTakeaway(""); }
                      }}
                      placeholder="Write a takeaway… (Enter to save)"
                      rows={2}
                      className="flex-1 bg-transparent text-sm text-[#d4d4d8] placeholder:text-muted-foreground/50 outline-none resize-none"
                    />
                    <button onClick={() => { setAddingTakeaway(false); setNewTakeaway(""); }}
                      className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {book.takeaways.length === 0 && !addingTakeaway && (
                  <p className="text-sm text-muted-foreground/60 text-center py-4">
                    No takeaways yet — add what you learned.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </PageShell>

      <BookDialog open={editOpen} onClose={() => { setEditOpen(false); reload(); }} existing={book} />
    </>
  );
}
