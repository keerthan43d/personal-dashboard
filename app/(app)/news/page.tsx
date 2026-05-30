"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  PenLine,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { NEWS_CATEGORIES } from "@/lib/news/sources";
import { stashNewsSeed } from "@/lib/news/handoff";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  snippet: string;
  category: string;
}

export default function NewsPage() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(NEWS_CATEGORIES[0].id);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrichingLink, setEnrichingLink] = useState<string | null>(null);

  const load = useCallback(async (catId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${catId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeCat);
  }, [activeCat, load]);

  const catLabel = NEWS_CATEGORIES.find((c) => c.id === activeCat)?.label ?? "";

  const handleWritePost = useCallback(
    async (item: NewsItem) => {
      setEnrichingLink(item.link);
      try {
        const res = await fetch("/api/news/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: item.source,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        stashNewsSeed({
          title: item.title,
          category: catLabel,
          research: data.research,
          link: item.link,
          source: item.source,
        });
        router.push("/linkedin-workflow");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not research this article");
        setEnrichingLink(null);
      }
    },
    [catLabel, router]
  );

  return (
    <>
      <Topbar
        title="News"
        subtitle="Daily feed · pick one to turn into a post"
        actions={
          <button
            onClick={() => load(activeCat)}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 border border-white/10 text-white/55 hover:border-white/20 hover:text-white/70 transition-all duration-150 text-[10px] font-black tracking-[0.1em] uppercase cursor-pointer disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        }
      />

      <PageShell>
        {/* Category tabs */}
        <div className="flex gap-1.5 mb-8 flex-wrap">
          {NEWS_CATEGORIES.map((c) => {
            const active = c.id === activeCat;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "px-3.5 py-2 text-[10px] font-black tracking-[0.12em] uppercase transition-all duration-150 cursor-pointer",
                  active
                    ? "bg-[#FFD600] text-black"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/6"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-[#FFD600]" />
            <span className="text-xs uppercase tracking-wider">Pulling {catLabel}…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <p className="text-sm text-white/60">{error}</p>
            <button
              onClick={() => load(activeCat)}
              className="text-[10px] font-black uppercase tracking-wider text-[#FFD600] hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-white/40 py-24 text-center">No articles right now. Try Refresh.</p>
        )}

        {/* Articles */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item) => {
              const enriching = enrichingLink === item.link;
              return (
                <article
                  key={item.link}
                  className="flex flex-col border border-white/8 bg-[#111111] p-4 hover:border-white/20 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-white/40">
                    <span className="text-[#FFD600] font-black">{item.source}</span>
                    {item.publishedAt && (
                      <>
                        <span className="text-white/20">·</span>
                        <span>{formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#f5f5f5] leading-snug mb-1.5">
                    {item.title}
                  </h3>

                  {item.snippet && (
                    <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-3">
                      {item.snippet}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => handleWritePost(item)}
                      disabled={enriching || !!enrichingLink}
                      className="flex items-center gap-1.5 h-8 px-3 bg-[#FFD600] hover:bg-[#FFE033] text-black text-[10px] font-black uppercase tracking-[0.08em] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {enriching ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Researching…</>
                      ) : (
                        <><PenLine className="w-3 h-3" /> Write a post</>
                      )}
                    </button>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 h-8 px-3 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.08em] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Read
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
