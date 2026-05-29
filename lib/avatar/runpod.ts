import type { ComfyPrompt } from "./workflow";

const RUNPOD_BASE = "https://api.runpod.ai/v2";

export type RunpodStatus =
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "TIMED_OUT";

export interface RunpodImageInput {
  /** Filename written into ComfyUI's input/ dir (must match LoadImage/LoadAudio). */
  name: string;
  /** Base64-encoded file contents (no data: prefix). */
  image: string;
}

export interface RunpodJobResponse {
  id: string;
  status: RunpodStatus;
  output?: unknown;
  error?: string;
}

function getConfig() {
  const apiKey = process.env.RUNPOD_API_KEY;
  const endpointId = process.env.RUNPOD_AVATAR_ENDPOINT_ID;
  if (!apiKey) throw new Error("RUNPOD_API_KEY not configured");
  if (!endpointId) throw new Error("RUNPOD_AVATAR_ENDPOINT_ID not configured");
  return { apiKey, endpointId };
}

function authHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Submit an async job to the serverless ComfyUI endpoint. Returns immediately
 * with a job id; poll getJobStatus() for the result.
 */
export async function submitJob(
  workflow: ComfyPrompt,
  images: RunpodImageInput[]
): Promise<RunpodJobResponse> {
  const { apiKey, endpointId } = getConfig();

  const res = await fetch(`${RUNPOD_BASE}/${endpointId}/run`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ input: { workflow, images } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RunPod /run failed (${res.status}): ${body}`);
  }
  return (await res.json()) as RunpodJobResponse;
}

/** Poll a job's status/output. */
export async function getJobStatus(jobId: string): Promise<RunpodJobResponse> {
  const { apiKey, endpointId } = getConfig();

  const res = await fetch(`${RUNPOD_BASE}/${endpointId}/status/${jobId}`, {
    method: "GET",
    headers: authHeaders(apiKey),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RunPod /status failed (${res.status}): ${body}`);
  }
  return (await res.json()) as RunpodJobResponse;
}

export interface ExtractedVideo {
  /** Public/S3 URL to the mp4, if the worker returned one. */
  url?: string;
  /** Base64-encoded mp4, if the worker inlined it. */
  base64?: string;
  /** Original filename, if known. */
  filename?: string;
}

/**
 * worker-comfyui output shapes vary by version and by whether an S3 bucket is
 * configured. We scan defensively for anything video-like: a URL ending in a
 * video extension, or a base64 entry whose filename is a video. Finalize the
 * exact shape once your endpoint is live (docs step 6).
 */
export function extractVideoFromOutput(output: unknown): ExtractedVideo | null {
  if (!output || typeof output !== "object") return null;

  const VIDEO_EXT = /\.(mp4|webm|mov|mkv)$/i;

  // Collect candidate entries from common keys.
  const obj = output as Record<string, unknown>;
  const buckets = [obj.images, obj.videos, obj.gifs, obj.files].filter(
    Array.isArray
  ) as unknown[][];
  const candidates = buckets.flat();

  for (const c of candidates) {
    if (typeof c === "string") {
      if (VIDEO_EXT.test(c) || c.startsWith("http")) return { url: c };
      continue;
    }
    if (c && typeof c === "object") {
      const e = c as Record<string, unknown>;
      const filename = typeof e.filename === "string" ? e.filename : undefined;
      const url =
        (typeof e.url === "string" && e.url) ||
        (typeof e.data === "string" && e.data.startsWith("http") && e.data) ||
        undefined;
      if (url && (VIDEO_EXT.test(url) || !filename || VIDEO_EXT.test(filename))) {
        return { url, filename };
      }
      const type = typeof e.type === "string" ? e.type : "";
      if (
        type.includes("base64") &&
        typeof e.data === "string" &&
        (!filename || VIDEO_EXT.test(filename))
      ) {
        return { base64: e.data, filename };
      }
    }
  }

  // Fallback: a top-level message that is a URL.
  if (typeof obj.message === "string" && obj.message.startsWith("http")) {
    return { url: obj.message };
  }
  return null;
}
