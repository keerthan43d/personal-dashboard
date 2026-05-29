import { NextRequest, NextResponse } from "next/server";
import { submitJob } from "@/lib/avatar/runpod";
import { buildAvatarPrompt, isWorkflowConfigured } from "@/lib/avatar/workflow";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/** Strip a `data:...;base64,` prefix if the client sent a data URL. */
function stripDataUrl(b64: string): string {
  const comma = b64.indexOf(",");
  return b64.startsWith("data:") && comma !== -1 ? b64.slice(comma + 1) : b64;
}

/** Keep a safe basename so it can't escape ComfyUI's input/ dir. */
function safeName(name: string, fallback: string): string {
  const base = (name || fallback).split(/[\\/]/).pop() ?? fallback;
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || fallback;
}

export async function POST(req: NextRequest) {
  try {
    if (!isWorkflowConfigured()) {
      return NextResponse.json(
        {
          error:
            "Avatar workflow not configured. Replace lib/avatar/workflow.api.json with your ComfyUI 'Save (API Format)' export (see docs/ai-avatar-runpod-setup.md).",
        },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      image?: string;
      audio?: string;
      script?: string;
      referenceText?: string;
      motionPrompt?: string;
      imageName?: string;
      audioName?: string;
    };

    const { image, audio, script } = body;
    if (!image || !audio || !script?.trim()) {
      return NextResponse.json(
        { error: "image, audio, and script are all required." },
        { status: 400 }
      );
    }

    const ts = Date.now();
    const imageName = safeName(body.imageName ?? "", `avatar_${ts}.png`);
    const audioName = safeName(body.audioName ?? "", `voice_${ts}.mp3`);

    const workflow = buildAvatarPrompt({
      imageName,
      audioName,
      script: script.trim(),
      referenceText: body.referenceText?.trim() || undefined,
      motionPrompt: body.motionPrompt?.trim() || undefined,
    });

    const job = await submitJob(workflow, [
      { name: imageName, image: stripDataUrl(image) },
      { name: audioName, image: stripDataUrl(audio) },
    ]);

    // Persist the job (best-effort — generation still works without Supabase).
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("avatar_videos").insert({
        status: job.status ?? "IN_QUEUE",
        runpod_job_id: job.id,
        script: script.trim(),
        reference_text: body.referenceText?.trim() || null,
        motion_prompt: body.motionPrompt?.trim() || null,
        image_name: imageName,
        audio_name: audioName,
      });
    }

    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
