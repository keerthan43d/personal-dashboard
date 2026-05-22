"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Save,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Newspaper,
  FileText,
  Megaphone,
  ImageIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { useLinkedIn, type TrendingTopic, type LinkedInDraft } from "@/lib/hooks/use-linkedin";
import { cn } from "@/lib/utils";

type View = "picks" | "drafts";
type Panel = "list" | "react" | "review";

const TONES = ["Agreeing", "Disagreeing", "Adding nuance", "Surprised"] as const;
const STYLES = ["Storytelling", "Educational", "Opinion"] as const;

export default function PersonalBrandingPage() {
  const {
    topics,
    drafts,
    loadingTopics,
    loadingDrafts,
    refreshing,
    generating,
    generatingImage,
    lastFetchedAt,
    loadTopics,
    refreshTopics,
    loadDrafts,
    generatePost,
    generateImage,
    saveDraft,
    updateDraft,
    updateDraftStatus,
    deleteDraft,
  } = useLinkedIn();

  const [view, setView] = useState<View>("picks");
  const [panel, setPanel] = useState<Panel>("list");
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<LinkedInDraft | null>(null);

  // React panel state
  const [reaction, setReaction] = useState("");
  const [tone, setTone] = useState<string>(TONES[0]);
  const [style, setStyle] = useState<string>(STYLES[1]);

  // Review state
  const [generatedPost, setGeneratedPost] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTopics();
    loadDrafts();
  }, []);

  // Auto-refresh if topics are stale (>12 hours)
  useEffect(() => {
    if (lastFetchedAt && !refreshing) {
      const staleMs = 12 * 60 * 60 * 1000;
      const age = Date.now() - new Date(lastFetchedAt).getTime();
      if (age > staleMs) {
        refreshTopics();
      }
    }
  }, [lastFetchedAt]);

  const handlePickTopic = useCallback((topic: TrendingTopic) => {
    setSelectedTopic(topic);
    setReaction("");
    setTone(TONES[0]);
    setStyle(STYLES[1]);
    setPanel("react");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedTopic || !reaction.trim()) return;
    try {
      const content = await generatePost({
        headline: selectedTopic.headline,
        summary: selectedTopic.summary,
        reaction: reaction.trim(),
        tone,
        style,
        sourceUrl: selectedTopic.sourceUrl,
      });
      setGeneratedPost(content);
      setPanel("review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    }
  }, [selectedTopic, reaction, tone, style, generatePost]);

  const handleGenerateImage = useCallback(async () => {
    if (!selectedTopic || !generatedPost) return;
    try {
      const url = await generateImage({
        headline: selectedTopic.headline,
        postContent: generatedPost,
      });
      setGeneratedImageUrl(url);
      toast.success("Image generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image generation failed");
    }
  }, [selectedTopic, generatedPost, generateImage]);

  const handleSaveDraft = useCallback(async () => {
    if (!selectedTopic || !generatedPost) return;
    await saveDraft({
      postContent: generatedPost,
      sourceHeadline: selectedTopic.headline,
      sourceUrl: selectedTopic.sourceUrl,
      reactionText: reaction,
      tone,
      style,
      status: "draft",
    });
    toast.success("Draft saved");
    setPanel("list");
    setSelectedTopic(null);
    setGeneratedPost("");
    setGeneratedImageUrl(null);
  }, [selectedTopic, generatedPost, reaction, tone, style, saveDraft]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPost]);

  const handleBack = useCallback(() => {
    if (panel === "review") {
      setPanel("react");
    } else {
      setPanel("list");
      setSelectedTopic(null);
    }
  }, [panel]);

  const staleInfo = lastFetchedAt
    ? formatTimeAgo(new Date(lastFetchedAt))
    : null;

  const draftCounts = {
    all: drafts.length,
    draft: drafts.filter((d) => d.status === "draft").length,
    used: drafts.filter((d) => d.status === "used").length,
  };

  return (
    <>
      <Topbar
        title="Personal Branding"
        subtitle={
          view === "picks"
            ? `${topics.length} trending topics${staleInfo ? ` · Updated ${staleInfo}` : ""}`
            : `${draftCounts.draft} drafts · ${draftCounts.used} used`
        }
        actions={
          <div className="flex items-center gap-2">
            {panel !== "list" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground h-8 gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}
            {view === "picks" && panel === "list" && (
              <Button
                onClick={() => refreshTopics()}
                disabled={refreshing}
                size="sm"
                className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 gap-1.5"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
                />
                {refreshing ? "Fetching…" : "Refresh"}
              </Button>
            )}
          </div>
        }
      />

      <PageShell>
        {panel === "list" && (
          <div className="mb-6">
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList className="bg-white/5 border border-white/8 h-9">
                <TabsTrigger
                  value="picks"
                  className="text-xs uppercase tracking-wider data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#f5f5f5] gap-1.5"
                >
                  <Newspaper className="w-3 h-3" />
                  Today&apos;s Picks
                  {topics.length > 0 && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({topics.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="drafts"
                  className="text-xs uppercase tracking-wider data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#f5f5f5] gap-1.5"
                >
                  <FileText className="w-3 h-3" />
                  Drafts
                  {draftCounts.draft > 0 && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({draftCounts.draft})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <AnimatePresence mode="wait">
          {panel === "list" && view === "picks" && (
            <motion.div
              key="picks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingList
                topics={topics}
                loading={loadingTopics || refreshing}
                onPick={handlePickTopic}
                onRefresh={refreshTopics}
              />
            </motion.div>
          )}

          {panel === "list" && view === "drafts" && (
            <motion.div
              key="drafts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DraftsList
                drafts={drafts}
                loading={loadingDrafts}
                onSelect={(d) => setSelectedDraft(d)}
                onDelete={async (id) => {
                  await deleteDraft(id);
                  toast.success("Draft deleted");
                }}
                onMarkUsed={async (id) => {
                  await updateDraftStatus(id, "used");
                  toast.success("Marked as used");
                }}
                onCopy={async (content) => {
                  await navigator.clipboard.writeText(content);
                  toast.success("Copied to clipboard");
                }}
              />
            </motion.div>
          )}

          {panel === "react" && selectedTopic && (
            <motion.div
              key="react"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReactPanel
                topic={selectedTopic}
                reaction={reaction}
                tone={tone}
                style={style}
                generating={generating}
                onReactionChange={setReaction}
                onToneChange={setTone}
                onStyleChange={setStyle}
                onGenerate={handleGenerate}
              />
            </motion.div>
          )}

          {panel === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReviewScreen
                post={generatedPost}
                onPostChange={setGeneratedPost}
                onSave={handleSaveDraft}
                onCopy={handleCopy}
                copied={copied}
                onRegenerate={handleGenerate}
                generating={generating}
                imageUrl={generatedImageUrl}
                onGenerateImage={handleGenerateImage}
                generatingImage={generatingImage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </>
  );
}

// ── Trending List ────────────────────────────────────────────────

function TrendingList({
  topics,
  loading,
  onPick,
  onRefresh,
}: {
  topics: TrendingTopic[];
  loading: boolean;
  onPick: (t: TrendingTopic) => void;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 skeleton" />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <EmptyState
        icon={<Newspaper className="w-6 h-6" />}
        title="No trending topics yet"
        description="Hit Refresh to fetch today's top stories across Marketing, AI in Marketing, and General AI."
        action={
          <Button
            onClick={onRefresh}
            size="sm"
            className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Fetch Topics
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic, i) => (
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25 }}
        >
          <TopicCard topic={topic} onPick={() => onPick(topic)} />
        </motion.div>
      ))}
    </div>
  );
}

function TopicCard({
  topic,
  onPick,
}: {
  topic: TrendingTopic;
  onPick: () => void;
}) {
  const tagColors: Record<string, string> = {
    Marketing: "bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20",
    "AI in Marketing": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "General AI": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div
      className={cn(
        "group p-5 border border-white/6 bg-[#111111] hover:border-white/12",
        "hover:bg-[#141414] transition-all duration-200 cursor-pointer"
      )}
      onClick={onPick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border",
                tagColors[topic.topicTag] ?? "bg-white/5 text-white/50 border-white/10"
              )}
            >
              {topic.topicTag}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTimeAgo(new Date(topic.fetchedAt))}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] leading-snug mb-1.5">
            {topic.headline}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {topic.summary}
          </p>
          {topic.sourceUrl && (
            <a
              href={topic.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 mt-2 text-[10px] text-[#FFD600]/60 hover:text-[#FFD600] transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" /> Source
            </a>
          )}
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Sparkles className="w-3 h-3 mr-1" /> Pick
        </Button>
      </div>
    </div>
  );
}

// ── React Panel ──────────────────────────────────────────────────

function ReactPanel({
  topic,
  reaction,
  tone,
  style,
  generating,
  onReactionChange,
  onToneChange,
  onStyleChange,
  onGenerate,
}: {
  topic: TrendingTopic;
  reaction: string;
  tone: string;
  style: string;
  generating: boolean;
  onReactionChange: (v: string) => void;
  onToneChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Article summary */}
      <div className="p-5 border border-white/6 bg-[#111111]">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border",
              topic.topicTag === "Marketing"
                ? "bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20"
                : topic.topicTag === "AI in Marketing"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            )}
          >
            {topic.topicTag}
          </span>
        </div>
        <h2 className="text-base font-semibold text-[#f5f5f5] mb-2">
          {topic.headline}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {topic.summary}
        </p>
        {topic.sourceUrl && (
          <a
            href={topic.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-[#FFD600]/60 hover:text-[#FFD600] transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Read full article
          </a>
        )}
      </div>

      {/* Reaction input */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground mb-2 block">
            Your honest take
          </label>
          <Input
            value={reaction}
            onChange={(e) => onReactionChange(e.target.value)}
            placeholder="Agree, disagree, what others are missing…"
            className="h-11 bg-white/5 border-white/10 text-sm placeholder:text-white/20"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground mb-2 block">
              Tone
            </label>
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground mb-2 block">
              Style
            </label>
            <Select value={style} onValueChange={onStyleChange}>
              <SelectTrigger className="h-10 bg-white/5 border-white/10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={generating || !reaction.trim()}
          className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Review Screen ────────────────────────────────────────────────

function ReviewScreen({
  post,
  onPostChange,
  onSave,
  onCopy,
  copied,
  onRegenerate,
  generating,
  imageUrl,
  onGenerateImage,
  generatingImage,
}: {
  post: string;
  onPostChange: (v: string) => void;
  onSave: () => void;
  onCopy: () => void;
  copied: boolean;
  onRegenerate: () => void;
  generating: boolean;
  imageUrl: string | null;
  onGenerateImage: () => void;
  generatingImage: boolean;
}) {
  const charCount = post.length;
  const inRange = charCount >= 1300 && charCount <= 1900;
  const tooShort = charCount < 1300;

  const handleDownloadImage = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `linkedin-post-image-${Date.now()}.png`;
    a.click();
  }, [imageUrl]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
          Review Post
        </h2>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[10px] font-mono tabular-nums",
              inRange
                ? "text-emerald-400"
                : tooShort
                ? "text-amber-400"
                : "text-rose-400"
            )}
          >
            {charCount}
          </span>
          <span className="text-[10px] text-muted-foreground">/1300-1900</span>
        </div>
      </div>

      <Textarea
        value={post}
        onChange={(e) => onPostChange(e.target.value)}
        rows={16}
        className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none font-sans"
      />

      {/* Image generation section */}
      <div className="border border-white/6 bg-[#111111] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Post Image
          </h3>
          <Button
            onClick={onGenerateImage}
            disabled={generatingImage}
            size="sm"
            variant="outline"
            className="h-7 border-white/10 text-white/70 hover:text-white hover:bg-white/5 gap-1.5 text-[10px] uppercase tracking-wider font-bold"
          >
            {generatingImage ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Generating…
              </>
            ) : imageUrl ? (
              <>
                <RefreshCw className="w-3 h-3" /> Regenerate
              </>
            ) : (
              <>
                <ImageIcon className="w-3 h-3" /> Generate Image
              </>
            )}
          </Button>
        </div>

        {generatingImage && !imageUrl && (
          <div className="flex items-center justify-center h-48 border border-dashed border-white/10">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Generating image…</span>
            </div>
          </div>
        )}

        {imageUrl && (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Generated LinkedIn post image"
              className="w-full border border-white/6"
            />
            <button
              onClick={handleDownloadImage}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/90 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {!imageUrl && !generatingImage && (
          <p className="text-[10px] text-muted-foreground/60">
            Generate a branded image to accompany your post. Uses your purple &amp; white brand style.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onCopy}
          className="flex-1 h-10 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy to Clipboard
            </>
          )}
        </Button>
        <Button
          onClick={onSave}
          variant="outline"
          className="h-10 border-white/10 text-white/70 hover:text-white hover:bg-white/5 gap-2"
        >
          <Save className="w-4 h-4" /> Save Draft
        </Button>
        <Button
          onClick={onRegenerate}
          disabled={generating}
          variant="ghost"
          className="h-10 text-muted-foreground hover:text-white gap-2"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Redo
        </Button>
      </div>
    </div>
  );
}

// ── Drafts List ──────────────────────────────────────────────────

function DraftsList({
  drafts,
  loading,
  onSelect,
  onDelete,
  onMarkUsed,
  onCopy,
}: {
  drafts: LinkedInDraft[];
  loading: boolean;
  onSelect: (d: LinkedInDraft) => void;
  onDelete: (id: string) => void;
  onMarkUsed: (id: string) => void;
  onCopy: (content: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 skeleton" />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-6 h-6" />}
        title="No drafts yet"
        description="Pick a trending topic and generate your first LinkedIn post."
      />
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft, i) => (
        <motion.div
          key={draft.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
        >
          <DraftCard
            draft={draft}
            onCopy={() => onCopy(draft.postContent)}
            onDelete={() => onDelete(draft.id)}
            onMarkUsed={() => onMarkUsed(draft.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function DraftCard({
  draft,
  onCopy,
  onDelete,
  onMarkUsed,
}: {
  draft: LinkedInDraft;
  onCopy: () => void;
  onDelete: () => void;
  onMarkUsed: () => void;
}) {
  const firstLine = draft.postContent.split("\n")[0] ?? "";
  const dateStr = new Date(draft.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group p-4 border border-white/6 bg-[#111111] hover:border-white/12 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border",
                draft.status === "draft"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : draft.status === "used"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-white/5 text-white/40 border-white/10"
              )}
            >
              {draft.status}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {draft.tone} · {draft.style}
            </span>
          </div>
          <p className="text-sm text-[#f5f5f5] line-clamp-1 font-medium">
            {firstLine}
          </p>
          {draft.sourceHeadline && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 truncate">
              Re: {draft.sourceHeadline}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onCopy}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/5 transition-colors"
            title="Copy"
          >
            <Copy className="w-3 h-3 text-white/50" />
          </button>
          {draft.status === "draft" && (
            <button
              onClick={onMarkUsed}
              className="w-7 h-7 flex items-center justify-center hover:bg-emerald-500/10 transition-colors"
              title="Mark as used"
            >
              <Check className="w-3 h-3 text-emerald-400/50" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-rose-400/50" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
