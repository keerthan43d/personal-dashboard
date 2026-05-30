"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Copy, Check, Save, RefreshCw, Loader2,
  ChevronRight, AlertCircle, CheckCircle2,
  TrendingUp, Calendar, ArrowRight, Globe, ImageIcon, Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { useLinkedIn } from "@/lib/hooks/use-linkedin";
import { cn } from "@/lib/utils";

// ── Day config ───────────────────────────────────────────────────

type DayType = "research" | "paste" | "planner";

interface DayConfig {
  jsDay: number;
  short: string;
  label: string;
  topic: string;
  description: string;
  type: DayType;
  pasteLabel?: string;
  pasteHint?: string;
}

const DAYS: DayConfig[] = [
  {
    jsDay: 1, short: "MON", label: "Monday",
    topic: "AI Marketing Tactic",
    description: "A specific technique marketers can use today",
    type: "research",
  },
  {
    jsDay: 2, short: "TUE", label: "Tuesday",
    topic: "Indian Brand Teardown",
    description: "What an Indian brand did and why it worked (or didn't)",
    type: "research",
  },
  {
    jsDay: 3, short: "WED", label: "Wednesday",
    topic: "My Case Study",
    description: "From a client project — your story, your results",
    type: "paste",
    pasteLabel: "Your case study notes",
    pasteHint: "Paste your raw notes — what the client needed, what you did, the results. Rough is fine.",
  },
  {
    jsDay: 4, short: "THU", label: "Thursday",
    topic: "AI News + My Take",
    description: "Today's AI news with your point of view",
    type: "research",
  },
  {
    jsDay: 5, short: "FRI", label: "Friday",
    topic: "Global Brand Strategy",
    description: "How a big brand thinks — decoded for marketers",
    type: "research",
  },
  {
    jsDay: 6, short: "SAT", label: "Saturday",
    topic: "Build in Public",
    description: "Something you built or learned this week",
    type: "paste",
    pasteLabel: "What you built or learned",
    pasteHint: "Paste your notes — what you made, what you discovered, what surprised you.",
  },
  {
    jsDay: 0, short: "SUN", label: "Sunday",
    topic: "Trend Scan",
    description: "Plan your next 6 days of content",
    type: "planner",
  },
];

function getTodayConfig(): DayConfig {
  const jsDay = new Date().getDay();
  return DAYS.find((d) => d.jsDay === jsDay) ?? DAYS[0];
}

// ── Step config ──────────────────────────────────────────────────

type Step =
  | "angle"
  | "research"
  | "approve"
  | "notes"
  | "take"
  | "generating"
  | "hook"
  | "final"
  | "image";

type ImageStyle = "artdirector" | "minimalist" | "statement" | "beeple" | "custom";

function getSteps(type: DayType): Step[] {
  if (type === "research") return ["angle", "research", "approve", "take", "generating", "hook", "final", "image"];
  if (type === "paste") return ["angle", "notes", "take", "generating", "hook", "final", "image"];
  return [];
}

function getStepLabel(step: Step): string {
  const labels: Record<Step, string> = {
    angle: "Angle",
    research: "Research",
    approve: "Review",
    notes: "Your Notes",
    take: "Your Take",
    generating: "Generating",
    hook: "Hook Check",
    final: "Final Post",
    image: "Image",
  };
  return labels[step];
}

// ── Hook analysis type ────────────────────────────────────────────

interface HookAnalysis {
  score: number;
  curiosity: "high" | "medium" | "low";
  specificity: "high" | "medium" | "low";
  tension: "high" | "medium" | "low";
  strong: boolean;
  reason: string;
}

interface HookOption {
  archetype: string;
  hook: string;
}

// ── Planner topic type ────────────────────────────────────────────

interface PlannerTopic {
  day: string;
  topic: string;
  summary: string;
  suggestedAngle: string;
  whyItWorks: string;
}

// ── Main page ─────────────────────────────────────────────────────

export default function LinkedInWorkflowPage() {
  const { saveDraft } = useLinkedIn();

  const [selectedDay, setSelectedDay] = useState<DayConfig>(getTodayConfig);
  const [step, setStep] = useState<Step>("angle");
  const [angle, setAngle] = useState("");
  const [research, setResearch] = useState("");
  const [notes, setNotes] = useState("");
  const [take, setTake] = useState("");
  const [post, setPost] = useState("");
  const [hookAnalysis, setHookAnalysis] = useState<HookAnalysis | null>(null);
  const [hookOptions, setHookOptions] = useState<HookOption[]>([]);
  const [plannerTopics, setPlannerTopics] = useState<PlannerTopic[]>([]);

  const [imageStyle, setImageStyle] = useState<ImageStyle>("artdirector");
  const [imageConcept, setImageConcept] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [loadingAngle, setLoadingAngle] = useState(false);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingHook, setLoadingHook] = useState(false);
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  const [loadingImagePrompt, setLoadingImagePrompt] = useState(false);
  const [loadingImageGen, setLoadingImageGen] = useState(false);
  const [regenHook, setRegenHook] = useState(false);
  const [loadingHookOptions, setLoadingHookOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset when day changes
  useEffect(() => {
    setStep("angle");
    setAngle("");
    setResearch("");
    setNotes("");
    setTake("");
    setPost("");
    setHookAnalysis(null);
    setHookOptions([]);
    setImageStyle("artdirector");
    setImageConcept("");
    setImagePrompt("");
    setImageUrl(null);
  }, [selectedDay]);

  // ── API calls ──────────────────────────────────────────────────

  const handleSurpriseMe = useCallback(async () => {
    setLoadingAngle(true);
    try {
      const res = await fetch("/api/linkedin/workflow/angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedDay.topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAngle(data.angle);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suggest angle");
    } finally {
      setLoadingAngle(false);
    }
  }, [selectedDay.topic]);

  const handlePullResearch = useCallback(async () => {
    if (!angle.trim()) return;
    setStep("research");
    setLoadingResearch(true);
    try {
      const res = await fetch("/api/linkedin/workflow/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedDay.topic, angle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResearch(data.research);
      setStep("approve");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Research failed");
      setStep("angle");
    } finally {
      setLoadingResearch(false);
    }
  }, [angle, selectedDay.topic]);

  const handleGenerate = useCallback(async () => {
    setStep("generating");
    setLoadingGenerate(true);
    try {
      const res = await fetch("/api/linkedin/workflow/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedDay.topic,
          angle,
          research: selectedDay.type === "research" ? research : undefined,
          notes: selectedDay.type === "paste" ? notes : undefined,
          take,
          dayType: selectedDay.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPost(data.postContent);

      // Auto-check hook
      const hookRes = await fetch("/api/linkedin/workflow/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: data.postContent, action: "check" }),
      });
      const hookData = await hookRes.json();
      if (hookRes.ok) setHookAnalysis(hookData.analysis);

      setHookOptions([]);
      setStep("hook");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
      setStep("take");
    } finally {
      setLoadingGenerate(false);
    }
  }, [selectedDay, angle, research, notes, take]);

  const handleLoadHookOptions = useCallback(async () => {
    setLoadingHookOptions(true);
    try {
      const res = await fetch("/api/linkedin/workflow/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post, action: "options", topic: angle ? `${selectedDay.topic} — ${angle}` : selectedDay.topic, take, research: selectedDay.type === "research" ? research : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHookOptions(data.options ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load hook options");
    } finally {
      setLoadingHookOptions(false);
    }
  }, [post, selectedDay.topic, selectedDay.type, angle, take, research]);

  const handleApplyHook = useCallback(async (newHook: string) => {
    const rest = post.split("\n").slice(1).join("\n");
    const newPost = newHook + "\n" + rest;
    setPost(newPost);
    setHookOptions([]);
    // Re-judge the freshly applied hook
    try {
      const res = await fetch("/api/linkedin/workflow/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: newPost, action: "check" }),
      });
      const data = await res.json();
      if (res.ok) setHookAnalysis(data.analysis);
    } catch {
      /* non-fatal — keep the applied hook */
    }
    toast.success("Hook applied");
  }, [post]);

  const handleRegenerateHook = useCallback(async () => {
    setRegenHook(true);
    try {
      const res = await fetch("/api/linkedin/workflow/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post, action: "regenerate", topic: angle ? `${selectedDay.topic} — ${angle}` : selectedDay.topic, take, research: selectedDay.type === "research" ? research : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPost(data.newPost);
      // Re-check
      const checkRes = await fetch("/api/linkedin/workflow/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: data.newPost, action: "check" }),
      });
      const checkData = await checkRes.json();
      if (checkRes.ok) setHookAnalysis(checkData.analysis);
      toast.success("Hook regenerated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate hook");
    } finally {
      setRegenHook(false);
    }
  }, [post, selectedDay.topic, selectedDay.type, angle, take, research]);

  const handleRegeneratePost = useCallback(async () => {
    await handleGenerate();
  }, [handleGenerate]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [post]);

  const handleSave = useCallback(async () => {
    await saveDraft({
      postContent: post,
      sourceHeadline: `${selectedDay.topic} — ${angle}`,
      sourceUrl: "",
      reactionText: take,
      tone: selectedDay.label,
      style: "Workflow",
      status: "draft",
    });
    toast.success("Saved to drafts");
  }, [post, selectedDay, angle, take, saveDraft]);

  const handleLoadPlanner = useCallback(async () => {
    setLoadingPlanner(true);
    try {
      const res = await fetch("/api/linkedin/workflow/planner", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlannerTopics(data.topics);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Planner failed");
    } finally {
      setLoadingPlanner(false);
    }
  }, []);

  const handleGenerateImagePrompt = useCallback(async (style: ImageStyle, currentPost: string) => {
    if (style === "custom") { setImagePrompt(""); return; }
    setLoadingImagePrompt(true);
    try {
      const res = await fetch("/api/linkedin/workflow/image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: currentPost, style, concept: style === "artdirector" ? imageConcept : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImagePrompt(data.prompt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Prompt generation failed");
    } finally {
      setLoadingImagePrompt(false);
    }
  }, [imageConcept]);

  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim()) return;
    setLoadingImageGen(true);
    setImageUrl(null);
    try {
      const res = await fetch("/api/linkedin/workflow/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.imageUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setLoadingImageGen(false);
    }
  }, [imagePrompt, imageStyle]);

  const handleDownloadImage = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `linkedin-image-${Date.now()}.png`;
    a.click();
  }, [imageUrl]);

  const handleSaveWithImage = useCallback(async () => {
    await saveDraft({
      postContent: post,
      sourceHeadline: `${selectedDay.topic} — ${angle}`,
      sourceUrl: imageUrl ?? "",
      reactionText: take,
      tone: selectedDay.label,
      style: "Workflow",
      status: "draft",
    });
    toast.success("Post + image saved to drafts");
  }, [post, selectedDay, angle, take, imageUrl, saveDraft]);

  // ── Step navigation helpers ────────────────────────────────────

  const steps = getSteps(selectedDay.type);
  const stepIndex = steps.indexOf(step);

  const goToStep = useCallback((s: Step) => setStep(s), []);

  // ── Render ─────────────────────────────────────────────────────

  const subtitle =
    selectedDay.type === "planner"
      ? "Sunday Planner — map out your week"
      : `${selectedDay.topic} · ${selectedDay.description}`;

  return (
    <>
      <Topbar
        title="LinkedIn Workflow"
        subtitle={subtitle}
        actions={
          step !== "angle" && selectedDay.type !== "planner" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("angle");
                setResearch("");
                setPost("");
                setHookAnalysis(null);
                setHookOptions([]);
              }}
              className="text-muted-foreground h-8 text-xs uppercase tracking-wider"
            >
              Start Over
            </Button>
          ) : undefined
        }
      />

      <PageShell>
        {/* ── Day selector ──────────────────────────────────────── */}
        <div className="flex gap-1.5 mb-8 flex-wrap">
          {DAYS.map((day) => {
            const isToday = day.jsDay === new Date().getDay();
            const active = selectedDay.jsDay === day.jsDay;
            return (
              <button
                key={day.short}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative px-3 py-2 text-[10px] font-black tracking-[0.12em] uppercase transition-all duration-150 cursor-pointer",
                  active
                    ? "bg-[#FFD600] text-black"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/6"
                )}
              >
                {day.short}
                {isToday && !active && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#FFD600]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Sunday planner ────────────────────────────────────── */}
        {selectedDay.type === "planner" && (
          <PlannerView
            topics={plannerTopics}
            loading={loadingPlanner}
            onLoad={handleLoadPlanner}
          />
        )}

        {/* ── Workflow steps ────────────────────────────────────── */}
        {selectedDay.type !== "planner" && (
          <>
            {/* Step progress bar */}
            <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => i < stepIndex && goToStep(s)}
                    disabled={i > stepIndex}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-150 whitespace-nowrap",
                      s === step
                        ? "bg-[#FFD600] text-black"
                        : i < stepIndex
                        ? "text-white/60 cursor-pointer hover:text-white"
                        : "text-white/20 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 flex items-center justify-center text-[9px] font-black border",
                        s === step
                          ? "border-black/30 bg-black/10"
                          : i < stepIndex
                          ? "border-white/30"
                          : "border-white/10"
                      )}
                    >
                      {i < stepIndex ? <Check className="w-2.5 h-2.5" /> : i + 1}
                    </span>
                    {getStepLabel(s)}
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-white/15 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Angle */}
              {step === "angle" && (
                <StepPanel key="angle">
                  <AngleStep
                    day={selectedDay}
                    angle={angle}
                    onAngleChange={setAngle}
                    onSurpriseMe={handleSurpriseMe}
                    loadingAngle={loadingAngle}
                    onNext={() => {
                      if (selectedDay.type === "research") handlePullResearch();
                      else goToStep("notes");
                    }}
                    loadingResearch={loadingResearch}
                  />
                </StepPanel>
              )}

              {/* Loading research */}
              {step === "research" && (
                <StepPanel key="research">
                  <LoadingState label="Pulling fresh research from the web…" />
                </StepPanel>
              )}

              {/* Step 3: Approve research */}
              {step === "approve" && (
                <StepPanel key="approve">
                  <ApproveStep
                    research={research}
                    onResearchChange={setResearch}
                    onApprove={() => goToStep("take")}
                    onReject={handlePullResearch}
                    loading={loadingResearch}
                  />
                </StepPanel>
              )}

              {/* Step: Paste notes */}
              {step === "notes" && (
                <StepPanel key="notes">
                  <NotesStep
                    day={selectedDay}
                    notes={notes}
                    onNotesChange={setNotes}
                    onNext={() => goToStep("take")}
                  />
                </StepPanel>
              )}

              {/* Step: Your take */}
              {step === "take" && (
                <StepPanel key="take">
                  <TakeStep
                    take={take}
                    onTakeChange={setTake}
                    onGenerate={handleGenerate}
                    loading={loadingGenerate}
                  />
                </StepPanel>
              )}

              {/* Generating */}
              {step === "generating" && (
                <StepPanel key="generating">
                  <LoadingState label="Writing your LinkedIn post…" />
                </StepPanel>
              )}

              {/* Step: Hook check */}
              {step === "hook" && (
                <StepPanel key="hook">
                  <HookStep
                    post={post}
                    analysis={hookAnalysis}
                    options={hookOptions}
                    onLoadOptions={handleLoadHookOptions}
                    loadingOptions={loadingHookOptions}
                    onApplyHook={handleApplyHook}
                    onRegenerateHook={handleRegenerateHook}
                    regenHook={regenHook}
                    onProceed={() => goToStep("final")}
                  />
                </StepPanel>
              )}

              {/* Step: Final post */}
              {step === "final" && (
                <StepPanel key="final">
                  <FinalStep
                    post={post}
                    onPostChange={setPost}
                    onCopy={handleCopy}
                    copied={copied}
                    onSave={handleSave}
                    onRegenerate={handleRegeneratePost}
                    loading={loadingGenerate}
                    onRegenerateHook={handleRegenerateHook}
                    regenHook={regenHook}
                    onGoToImage={() => {
                      setImageUrl(null);
                      setImagePrompt("");
                      goToStep("image");
                      handleGenerateImagePrompt(imageStyle, post);
                    }}
                  />
                </StepPanel>
              )}

              {/* Step: Image generation */}
              {step === "image" && (
                <StepPanel key="image">
                  <ImageStep
                    post={post}
                    style={imageStyle}
                    onStyleChange={(s) => {
                      setImageStyle(s);
                      setImageUrl(null);
                      handleGenerateImagePrompt(s, post);
                    }}
                    concept={imageConcept}
                    onConceptChange={setImageConcept}
                    imagePrompt={imagePrompt}
                    onImagePromptChange={setImagePrompt}
                    onRegeneratePrompt={() => handleGenerateImagePrompt(imageStyle, post)}
                    loadingPrompt={loadingImagePrompt}
                    imageUrl={imageUrl}
                    onGenerateImage={handleGenerateImage}
                    loadingImage={loadingImageGen}
                    onDownload={handleDownloadImage}
                    onSave={handleSaveWithImage}
                  />
                </StepPanel>
              )}
            </AnimatePresence>
          </>
        )}
      </PageShell>
    </>
  );
}

// ── Step wrapper animation ────────────────────────────────────────

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ── Loading state ─────────────────────────────────────────────────

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-8 h-8 text-[#FFD600] animate-spin" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Step 1: Angle ─────────────────────────────────────────────────

function AngleStep({
  day,
  angle,
  onAngleChange,
  onSurpriseMe,
  loadingAngle,
  onNext,
  loadingResearch,
}: {
  day: DayConfig;
  angle: string;
  onAngleChange: (v: string) => void;
  onSurpriseMe: () => void;
  loadingAngle: boolean;
  onNext: () => void;
  loadingResearch: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-5 border border-white/6 bg-[#111111]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#FFD600]">
            {day.label}
          </span>
        </div>
        <h2 className="text-lg font-black text-[#f5f5f5] mb-1">{day.topic}</h2>
        <p className="text-sm text-muted-foreground">{day.description}</p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground block">
          What angle do you want to take?
        </label>
        <Input
          value={angle}
          onChange={(e) => onAngleChange(e.target.value)}
          placeholder={day.type === "paste" ? "What's the main thing you want to cover?" : "Type your angle, or hit Surprise Me"}
          className="h-11 bg-white/5 border-white/10 text-sm placeholder:text-white/20"
        />
        <Button
          onClick={onSurpriseMe}
          disabled={loadingAngle}
          variant="outline"
          size="sm"
          className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-1.5 text-xs uppercase tracking-wider font-black"
        >
          {loadingAngle ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Surprise Me
        </Button>
      </div>

      <Button
        onClick={onNext}
        disabled={!angle.trim() || loadingAngle || loadingResearch}
        className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
      >
        {loadingResearch ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Pulling Research…
          </>
        ) : (
          <>
            {day.type === "research" ? "Pull Research" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );
}

// ── Step 3: Approve research ──────────────────────────────────────

function ApproveStep({
  research,
  onResearchChange,
  onApprove,
  onReject,
  loading,
}: {
  research: string;
  onResearchChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          Raw Research — Review before continuing
        </h3>
        <span className="text-[10px] text-muted-foreground/60">
          Edit if needed, then approve
        </span>
      </div>

      <Textarea
        value={research}
        onChange={(e) => onResearchChange(e.target.value)}
        rows={14}
        className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none font-mono text-white/80"
      />

      <div className="flex items-center gap-2">
        <Button
          onClick={onApprove}
          className="flex-1 h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Approve Research
        </Button>
        <Button
          onClick={onReject}
          disabled={loading}
          variant="outline"
          className="h-11 border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2 font-black uppercase tracking-wider text-xs"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Try Again
        </Button>
      </div>
    </div>
  );
}

// ── Step: Notes ───────────────────────────────────────────────────

function NotesStep({
  day,
  notes,
  onNotesChange,
  onNext,
}: {
  day: DayConfig;
  notes: string;
  onNotesChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground block">
        {day.pasteLabel ?? "Your notes"}
      </label>
      <p className="text-xs text-muted-foreground/70">{day.pasteHint}</p>

      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={14}
        placeholder="Paste your raw notes here…"
        className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none"
      />

      <Button
        onClick={onNext}
        disabled={!notes.trim()}
        className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Step: Your take ───────────────────────────────────────────────

function TakeStep({
  take,
  onTakeChange,
  onGenerate,
  loading,
}: {
  take: string;
  onTakeChange: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-5 border border-[#FFD600]/20 bg-[#FFD600]/5">
        <p className="text-sm font-bold text-[#FFD600]">One question before we write the post.</p>
        <p className="text-xs text-[#FFD600]/70 mt-1">
          This is mandatory. Your opinion is what makes the post worth reading.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-base font-black text-[#f5f5f5]">
          What&apos;s your take on this?
        </label>
        <Textarea
          value={take}
          onChange={(e) => onTakeChange(e.target.value)}
          rows={4}
          placeholder="Your honest opinion — agree, disagree, what others are missing. One line or a few sentences; this becomes the spine of the post."
          className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none placeholder:text-white/20"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && take.trim()) onGenerate();
          }}
        />
        <p className="text-[10px] text-muted-foreground/60">Cmd/Ctrl + Enter to generate</p>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!take.trim() || loading}
        className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
      >
        {loading ? (
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
  );
}

// ── Step: Hook check ──────────────────────────────────────────────

function HookStep({
  post,
  analysis,
  options,
  onLoadOptions,
  loadingOptions,
  onApplyHook,
  onRegenerateHook,
  regenHook,
  onProceed,
}: {
  post: string;
  analysis: HookAnalysis | null;
  options: HookOption[];
  onLoadOptions: () => void;
  loadingOptions: boolean;
  onApplyHook: (hook: string) => void;
  onRegenerateHook: () => void;
  regenHook: boolean;
  onProceed: () => void;
}) {
  const firstLine = post.split("\n").find((l) => l.trim().length > 0) ?? "";
  const score = analysis?.score ?? 0;
  const scoreColor =
    score >= 7 ? "text-emerald-400" : score >= 5 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="p-5 border border-white/6 bg-[#111111] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Hook Analysis
          </h3>
          {analysis && (
            <span className={cn("text-xs font-black tabular-nums", scoreColor)}>
              {analysis.score}/10
            </span>
          )}
        </div>
        <p className="text-base font-semibold text-[#f5f5f5] leading-snug">&ldquo;{firstLine}&rdquo;</p>

        {analysis && (
          <div className="space-y-2 pt-2 border-t border-white/6">
            <div className="flex flex-wrap gap-2">
              <HookMetric label="Curiosity" level={analysis.curiosity} />
              <HookMetric label="Tension" level={analysis.tension} />
              <HookMetric label="Specificity" level={analysis.specificity} />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">{analysis.reason}</p>
          </div>
        )}
      </div>

      {analysis && !analysis.strong && (
        <div className="flex items-start gap-2 p-3 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>This hook won&apos;t stop the scroll. Try the alternatives below — it&apos;s the first thing people see.</span>
        </div>
      )}

      {/* 3 hook options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Alternative hooks
          </h3>
          <button
            onClick={onLoadOptions}
            disabled={loadingOptions}
            className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-40"
          >
            {loadingOptions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {options.length > 0 ? "More" : "Generate 3 options"}
          </button>
        </div>

        {loadingOptions && options.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 skeleton" />
            ))}
          </div>
        )}

        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onApplyHook(opt.hook)}
            className="w-full text-left p-4 border border-white/8 bg-[#111111] hover:border-[#FFD600]/50 hover:bg-[#FFD600]/5 transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#FFD600]/70">
                {opt.archetype}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/50 group-hover:text-[#FFD600]">
                Use this →
              </span>
            </div>
            <p className="text-sm text-[#f5f5f5] leading-snug whitespace-pre-line">{opt.hook}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onProceed}
          className="flex-1 h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
        >
          {analysis?.strong ? "Looks good — Final Post" : "Use Anyway"}
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={onRegenerateHook}
          disabled={regenHook}
          variant="outline"
          className="h-11 border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2 font-black uppercase tracking-wider text-xs"
        >
          {regenHook ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          New Hook
        </Button>
      </div>
    </div>
  );
}

function HookMetric({ label, level }: { label: string; level: "high" | "medium" | "low" }) {
  const color =
    level === "high"
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
      : level === "medium"
      ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
      : "text-rose-400 border-rose-400/30 bg-rose-400/5";
  return (
    <span className={cn("text-[10px] font-bold px-2 py-1 border tracking-wide", color)}>
      {label}: {level}
    </span>
  );
}

// ── Step: Final post ──────────────────────────────────────────────

function FinalStep({
  post,
  onPostChange,
  onCopy,
  copied,
  onSave,
  onRegenerate,
  loading,
  onRegenerateHook,
  regenHook,
  onGoToImage,
}: {
  post: string;
  onPostChange: (v: string) => void;
  onCopy: () => void;
  copied: boolean;
  onSave: () => void;
  onRegenerate: () => void;
  loading: boolean;
  onRegenerateHook: () => void;
  regenHook: boolean;
  onGoToImage: () => void;
}) {
  const charCount = post.length;
  const inRange = charCount >= 1200 && charCount <= 1800;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          Your LinkedIn Post
        </h3>
        <span
          className={cn(
            "text-[10px] font-mono tabular-nums",
            inRange ? "text-emerald-400" : "text-amber-400"
          )}
        >
          {charCount} chars
        </span>
      </div>

      <Textarea
        value={post}
        onChange={(e) => onPostChange(e.target.value)}
        rows={16}
        className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none font-sans"
      />

      {/* Primary CTA — go to image step */}
      <Button
        onClick={onGoToImage}
        className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
      >
        <ImageIcon className="w-4 h-4" /> Generate Image
      </Button>

      {/* Secondary actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onCopy}
          variant="outline"
          className="flex-1 h-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2"
        >
          {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Post</>}
        </Button>
        <Button
          onClick={onSave}
          variant="outline"
          className="h-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2"
        >
          <Save className="w-4 h-4" /> Save Draft
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onRegenerateHook}
          disabled={regenHook}
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground hover:text-white gap-1.5 text-xs font-black uppercase tracking-wider"
        >
          {regenHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          New Hook
        </Button>
        <Button
          onClick={onRegenerate}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground hover:text-white gap-1.5 text-xs font-black uppercase tracking-wider"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Full Regenerate
        </Button>
      </div>
    </div>
  );
}

// ── Image Step ────────────────────────────────────────────────────

const IMAGE_STYLES: { value: ImageStyle; label: string; hint: string }[] = [
  { value: "artdirector", label: "Art Director", hint: "Designs from your references + concept" },
  { value: "minimalist", label: "Minimalist", hint: "Clean, premium, negative space" },
  { value: "statement", label: "Statement Card", hint: "Big bold text + number" },
  { value: "beeple", label: "Beeple Style", hint: "Surreal, cinematic, hyper-detailed" },
  { value: "custom", label: "Custom", hint: "Write your own prompt" },
];

function ImageStep({
  post,
  style,
  onStyleChange,
  concept,
  onConceptChange,
  imagePrompt,
  onImagePromptChange,
  onRegeneratePrompt,
  loadingPrompt,
  imageUrl,
  onGenerateImage,
  loadingImage,
  onDownload,
  onSave,
}: {
  post: string;
  style: ImageStyle;
  onStyleChange: (s: ImageStyle) => void;
  concept: string;
  onConceptChange: (v: string) => void;
  imagePrompt: string;
  onImagePromptChange: (v: string) => void;
  onRegeneratePrompt: () => void;
  loadingPrompt: boolean;
  imageUrl: string | null;
  onGenerateImage: () => void;
  loadingImage: boolean;
  onDownload: () => void;
  onSave: () => void;
}) {
  // Suppress unused warning — post is used by parent when generating the prompt
  void post;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Style selector */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground block mb-3">
          Image style
        </label>
        <div className="flex flex-wrap gap-2">
          {IMAGE_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStyleChange(s.value)}
              className={cn(
                "flex-1 min-w-[130px] p-3 text-left transition-all duration-150 border cursor-pointer",
                style === s.value
                  ? "border-[#FFD600] bg-[#FFD600]/10"
                  : "border-white/8 bg-[#111111] hover:border-white/20"
              )}
            >
              <div className={cn("text-xs font-black uppercase tracking-wider mb-0.5", style === s.value ? "text-[#FFD600]" : "text-[#f5f5f5]")}>
                {s.label}
              </div>
              <div className="text-[10px] text-muted-foreground">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Concept box — Art Director designs around this */}
      {style === "artdirector" && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground block">
            Your concept <span className="text-white/30 normal-case font-normal tracking-normal">(optional — leave blank to let the designer decide)</span>
          </label>
          <Textarea
            value={concept}
            onChange={(e) => onConceptChange(e.target.value)}
            rows={3}
            placeholder="The idea you want shown — e.g. “front-page splash, a marble statue scrolling a phone, blood-red accent”. The art director reads your post + your references and designs around this."
            className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none placeholder:text-white/20"
          />
          <button
            onClick={onRegeneratePrompt}
            disabled={loadingPrompt}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FFD600]/80 hover:text-[#FFD600] transition-colors cursor-pointer disabled:opacity-40"
          >
            {loadingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Design from concept
          </button>
        </div>
      )}

      {/* Prompt box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            {style === "custom" ? "Your prompt" : "Generated image prompt"}
          </label>
          {style !== "custom" && (
            <button
              onClick={onRegeneratePrompt}
              disabled={loadingPrompt}
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-40"
            >
              {loadingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Regenerate
            </button>
          )}
        </div>

        {loadingPrompt ? (
          <div className="h-28 border border-white/6 bg-[#111111] flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Generating prompt…</span>
          </div>
        ) : (
          <Textarea
            value={imagePrompt}
            onChange={(e) => onImagePromptChange(e.target.value)}
            rows={5}
            placeholder={style === "custom" ? "Describe the image you want. Brand colors (royal purple + white) will be applied." : ""}
            className="bg-white/5 border-white/10 text-sm leading-relaxed resize-none"
          />
        )}

        {imagePrompt && (
          <p className="text-[10px] text-muted-foreground/50 tabular-nums">
            {imagePrompt.split(/\s+/).filter(Boolean).length} words
          </p>
        )}
      </div>

      {/* Generate image button */}
      <Button
        onClick={onGenerateImage}
        disabled={loadingImage || !imagePrompt.trim() || loadingPrompt}
        className="w-full h-11 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
      >
        {loadingImage ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating Image…</>
        ) : (
          <><ImageIcon className="w-4 h-4" /> Generate Image</>
        )}
      </Button>

      {/* Loading placeholder */}
      {loadingImage && (
        <div className="aspect-[4/5] max-w-sm mx-auto border border-dashed border-white/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD600]" />
            <span className="text-xs">
              {style === "beeple"
                ? "Rendering cinematic scene…"
                : style === "statement"
                ? "Setting bold type…"
                : style === "artdirector"
                ? "Art directing your poster…"
                : "Composing design…"}
            </span>
          </div>
        </div>
      )}

      {/* Image result */}
      {imageUrl && !loadingImage && (
        <div className="space-y-3">
          <div className="aspect-[4/5] max-w-sm mx-auto border border-white/8 overflow-hidden relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Generated LinkedIn post image"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onSave}
              className="flex-1 h-10 bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
            >
              <Save className="w-4 h-4" /> Save to Library
            </Button>
            <Button
              onClick={onDownload}
              variant="outline"
              className="h-10 border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2"
            >
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button
              onClick={onGenerateImage}
              disabled={loadingImage}
              variant="ghost"
              className="h-10 text-muted-foreground hover:text-white gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Redo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sunday Planner ────────────────────────────────────────────────

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/20",
  Tuesday: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Thursday: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Friday: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function PlannerView({
  topics,
  loading,
  onLoad,
}: {
  topics: PlannerTopic[];
  loading: boolean;
  onLoad: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 skeleton" />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white/50" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-[#f5f5f5]">Plan your week</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Pull 5 trending topics from this week with suggested angles for Monday to Friday.
          </p>
        </div>
        <Button
          onClick={onLoad}
          className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black uppercase tracking-[0.06em] gap-2"
        >
          <TrendingUp className="w-4 h-4" /> Scan This Week
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {topics.length} topics for next week
        </h3>
        <Button
          onClick={onLoad}
          variant="ghost"
          size="sm"
          className="h-7 text-muted-foreground hover:text-white gap-1.5 text-[10px] uppercase tracking-wider font-black"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>
      {topics.map((topic, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.25 }}
        >
          <PlannerCard topic={topic} />
        </motion.div>
      ))}
    </div>
  );
}

function PlannerCard({ topic }: { topic: PlannerTopic }) {
  const colorClass = DAY_COLORS[topic.day] ?? "bg-white/5 text-white/40 border-white/10";

  return (
    <div className="p-5 border border-white/6 bg-[#111111] hover:border-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-1 border flex-shrink-0 mt-0.5", colorClass)}>
          {topic.day}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold text-[#f5f5f5] leading-snug">{topic.topic}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{topic.summary}</p>
          <div className="pt-2 border-t border-white/6 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#FFD600]/70">
              Suggested angle
            </p>
            <p className="text-xs text-white/70 leading-relaxed">{topic.suggestedAngle}</p>
            <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 pt-1">
              <Globe className="w-2.5 h-2.5" /> {topic.whyItWorks}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
