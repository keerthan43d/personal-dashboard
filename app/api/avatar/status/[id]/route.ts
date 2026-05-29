import { NextRequest, NextResponse } from "next/server";
import { getJobStatus, extractVideoFromOutput } from "@/lib/avatar/runpod";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET = "avatar-videos";

/** Upload a base64 mp4 to Supabase Storage and return its public URL. */
async function persistBase64(
  supabase: NonNullable<ReturnType<typeof getSupabaseServer>>,
  jobId: string,
  base64: string
): Promise<string | null> {
  try {
    const bytes = Buffer.from(base64, "base64");
    const path = `${jobId}.mp4`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "video/mp4", upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();

    // Short-circuit if we already resolved this job.
    if (supabase) {
      const { data: row } = await supabase
        .from("avatar_videos")
        .select("video_url, status")
        .eq("runpod_job_id", id)
        .maybeSingle();
      if (row?.video_url) {
        return NextResponse.json({ status: "COMPLETED", videoUrl: row.video_url });
      }
    }

    const job = await getJobStatus(id);

    if (job.status === "COMPLETED") {
      const video = extractVideoFromOutput(job.output);
      let videoUrl = video?.url ?? null;

      // Inline base64 -> persist to storage so the page can stream it.
      if (!videoUrl && video?.base64 && supabase) {
        videoUrl = await persistBase64(supabase, id, video.base64);
      }

      if (supabase) {
        await supabase
          .from("avatar_videos")
          .update({ status: "COMPLETED", video_url: videoUrl })
          .eq("runpod_job_id", id);
      }

      return NextResponse.json({
        status: "COMPLETED",
        videoUrl,
        // Surface inline base64 only if we couldn't store it anywhere.
        videoBase64: videoUrl ? undefined : video?.base64,
      });
    }

    if (job.status === "FAILED" || job.status === "CANCELLED" || job.status === "TIMED_OUT") {
      if (supabase) {
        await supabase
          .from("avatar_videos")
          .update({ status: job.status, error: job.error ?? null })
          .eq("runpod_job_id", id);
      }
      return NextResponse.json({ status: job.status, error: job.error ?? null });
    }

    // Still running.
    return NextResponse.json({ status: job.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status check failed" },
      { status: 500 }
    );
  }
}
