"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, ImageIcon, Mic, Download, AlertCircle,
  CheckCircle2, ChevronDown, Video, Clapperboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/shared/page-shell";
import { getSupabase } from "@/lib/db/supabase-client";
import { cn } from "@/lib/utils";

type JobStatus =
  | "IDLE" | "IN_QUEUE" | "IN_PROGRESS"
  | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";

interface AvatarRow {
  id: string;
  created_at: string;
  status: string;
  script: string;
  video_url: string | null;
}

const POLL_MS = 5000;

/** Read a File into a base64 string (no data: prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma !== -1 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60); // ~150 wpm
}

const STATUS_META: Record<string, { label: string; pct: number }> = {
  IN_QUEUE: { label: "Queued — waiting for a worker", pct: 15 },
  IN_PROGRESS: { label: "Rendering your avatar (this takes a few minutes)", pct: 60 },
  COMPLETED: { label: "Done", pct: 100 },
  FAILED: { label: "Failed", pct: 100 },
  CANCELLED: { label: "Cancelled", pct: 100 },
  TIMED_OUT: { label: "Timed out", pct: 100 },
};

export default function AiAvatarPage() {
  // Inputs
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>("");
  const [script, setScript] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [motionPrompt, setMotionPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Job
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>("IDLE");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<AvatarRow[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("avatar_videos")
        .select("id, created_at, status, script, video_url")
        .order("created_at", { ascending: false })
        .limit(12);
      setHistory((data as AvatarRow[]) ?? []);
    } catch {
      /* Supabase not configured — history just stays empty. */
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Poll the job until it reaches a terminal state.
  useEffect(() => {
    if (!jobId || status === "COMPLETED" || status === "IDLE" ||
        status === "FAILED" || status === "CANCELLED" || status === "TIMED_OUT") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/avatar/status/${jobId}`);
        const data = await res.json();
        if (data.error) { setStatus("FAILED"); setError(data.error); return; }
        setStatus(data.status);
        if (data.status === "COMPLETED") {
          setVideoUrl(data.videoUrl ?? null);
          if (!data.videoUrl && data.videoBase64) {
            setVideoUrl(`data:video/mp4;base64,${data.videoBase64}`);
          }
          toast.success("Your avatar video is ready");
          loadHistory();
        } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(data.status)) {
          setError(data.error ?? `Job ${data.status.toLowerCase()}`);
          loadHistory();
        }
      } catch {
        /* transient — keep polling */
      }
    }, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, status, loadHistory]);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setPhotoName(file.name);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoB64(await fileToBase64(file));
  };
  const onAudio = async (file?: File) => {
    if (!file) return;
    setAudioName(file.name);
    setAudioB64(await fileToBase64(file));
  };

  const canGenerate = photoB64 && audioB64 && script.trim() && !submitting &&
    status !== "IN_QUEUE" && status !== "IN_PROGRESS";

  const handleGenerate = useCallback(async () => {
    if (!photoB64 || !audioB64 || !script.trim()) return;
    setSubmitting(true);
    setError(null); setVideoUrl(null); setJobId(null); setStatus("IDLE");
    try {
      const res = await fetch("/api/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photoB64, audio: audioB64,
          imageName: photoName, audioName,
          script, referenceText, motionPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setJobId(data.jobId);
      setStatus(data.status ?? "IN_QUEUE");
      toast.success("Submitted — rendering started");
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setSubmitting(false);
    }
  }, [photoB64, audioB64, photoName, audioName, script, referenceText, motionPrompt, loadHistory]);

  const busy = status === "IN_QUEUE" || status === "IN_PROGRESS";
  const dur = estimateDuration(script);

  return (
    <>
      <Topbar title="AI Avatar" subtitle="Photo + voice + script → talking video" />
      <PageShell>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">

          {/* ── Inputs ─────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Photo */}
            <Field label="01 — Your photo" icon={<ImageIcon className="w-3.5 h-3.5" />}>
              <label className={cn(
                "group relative flex items-center justify-center h-44 cursor-pointer overflow-hidden",
                "border border-dashed border-white/15 hover:border-[#FFD600]/50 transition-colors bg-white/[0.02]"
              )}>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] text-white/35 tracking-wide uppercase">
                    Click to upload a clear front-facing photo
                  </span>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
            </Field>

            {/* Voice */}
            <Field label="02 — Voice sample (5–15s)" icon={<Mic className="w-3.5 h-3.5" />}>
              <label className={cn(
                "flex items-center gap-3 h-12 px-4 cursor-pointer",
                "border border-dashed border-white/15 hover:border-[#FFD600]/50 transition-colors bg-white/[0.02]"
              )}>
                <Mic className="w-4 h-4 text-white/40" />
                <span className="text-[11px] text-white/55 truncate">
                  {audioName || "Click to upload a natural voice clip to clone"}
                </span>
                <input type="file" accept="audio/*" className="hidden"
                  onChange={(e) => onAudio(e.target.files?.[0])} />
              </label>
            </Field>

            {/* Script */}
            <Field label="03 — Script (what they say)" icon={<Sparkles className="w-3.5 h-3.5" />}>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Type exactly what your avatar should say…"
                className="min-h-[120px] resize-y bg-white/[0.02] border-white/10 text-sm"
              />
              {script.trim() && (
                <p className="mt-1.5 text-[10px] text-white/30 uppercase tracking-wide">
                  ~{dur}s of speech · {script.trim().split(/\s+/).filter(Boolean).length} words
                  {dur > 24 && <span className="text-amber-400/70"> · keep under ~24s for best results</span>}
                </p>
              )}
            </Field>

            {/* Advanced */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.12em] uppercase text-white/40 hover:text-white/70 transition-colors"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")} />
              Advanced
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4"
                >
                  <Field label="Voice-sample transcript (optional)">
                    <Input value={referenceText} onChange={(e) => setReferenceText(e.target.value)}
                      placeholder="What the uploaded voice clip says — improves cloning"
                      className="bg-white/[0.02] border-white/10 text-sm" />
                  </Field>
                  <Field label="Motion / scene prompt (optional)">
                    <Textarea value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)}
                      placeholder="Leave blank for a clean studio talking-head. Describe motion only if needed."
                      className="min-h-[70px] bg-white/[0.02] border-white/10 text-sm" />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full h-11 bg-[#FFD600] text-black hover:bg-[#FFD600]/90 font-black tracking-[0.1em] uppercase text-[11px] disabled:opacity-40"
            >
              {submitting || busy
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                : <><Clapperboard className="w-4 h-4 mr-2" /> Generate Avatar Video</>}
            </Button>
          </div>

          {/* ── Result ─────────────────────────────────────────── */}
          <div className="space-y-5">
            <Field label="Result" icon={<Video className="w-3.5 h-3.5" />}>
              <div className="aspect-[9/16] w-full max-w-[300px] mx-auto border border-white/10 bg-black flex items-center justify-center overflow-hidden">
                {videoUrl ? (
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                ) : busy ? (
                  <div className="text-center px-6 w-full">
                    <Loader2 className="w-7 h-7 mx-auto mb-4 text-[#FFD600] animate-spin" />
                    <Progress value={STATUS_META[status]?.pct ?? 10} className="h-1 mb-3" />
                    <p className="text-[11px] text-white/45 tracking-wide">
                      {STATUS_META[status]?.label ?? "Working…"}
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center px-6">
                    <AlertCircle className="w-7 h-7 mx-auto mb-3 text-rose-400" />
                    <p className="text-[11px] text-rose-300/80">{error}</p>
                  </div>
                ) : (
                  <span className="text-[11px] text-white/25 uppercase tracking-wide">
                    Your video will appear here
                  </span>
                )}
              </div>
              {videoUrl && (
                <a href={videoUrl} download
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.12em] uppercase text-[#FFD600] hover:underline">
                  <Download className="w-3.5 h-3.5" /> Download mp4
                </a>
              )}
            </Field>

            {/* History */}
            {history.length > 0 && (
              <Field label="Recent">
                <div className="grid grid-cols-2 gap-2">
                  {history.map((row) => (
                    <button key={row.id}
                      onClick={() => row.video_url && setVideoUrl(row.video_url)}
                      className={cn(
                        "text-left p-3 border border-white/8 bg-white/[0.02] hover:border-white/20 transition-colors",
                        !row.video_url && "opacity-60 cursor-default"
                      )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {row.status === "COMPLETED"
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          : <Loader2 className={cn("w-3 h-3 text-white/40", row.status !== "COMPLETED" && "animate-spin")} />}
                        <span className="text-[9px] uppercase tracking-wider text-white/40">{row.status}</span>
                      </div>
                      <p className="text-[11px] text-white/70 line-clamp-2">{row.script}</p>
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>
        </div>
      </PageShell>
    </>
  );
}

function Field({ label, icon, children }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black tracking-[0.14em] uppercase text-white/45">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}
