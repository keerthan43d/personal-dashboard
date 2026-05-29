import { createClient } from "@supabase/supabase-js";
import { buildVoicePrompt, DEFAULT_VOICE_CONFIG } from "@/lib/linkedin/voice-config";

export interface VoiceConfig {
  toneGuidelines: string;
  doWords: string[];
  dontWords: string[];
  samplePosts: string[];
  formattingRules: string;
}

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Loads the voice config from Supabase if a row exists, otherwise falls back
 * to DEFAULT_VOICE_CONFIG. Never throws — a missing/broken DB just yields the
 * default Hormozi voice so generation always works.
 */
export async function loadVoiceConfig(): Promise<VoiceConfig> {
  const supabase = getSupabaseServer();
  if (!supabase) return DEFAULT_VOICE_CONFIG;

  try {
    const { data: voiceRow } = await supabase
      .from("linkedin_voice_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!voiceRow) return DEFAULT_VOICE_CONFIG;

    return {
      toneGuidelines: voiceRow.tone_guidelines ?? DEFAULT_VOICE_CONFIG.toneGuidelines,
      doWords: voiceRow.do_words ?? DEFAULT_VOICE_CONFIG.doWords,
      dontWords: voiceRow.dont_words ?? DEFAULT_VOICE_CONFIG.dontWords,
      samplePosts: voiceRow.sample_posts ?? DEFAULT_VOICE_CONFIG.samplePosts,
      formattingRules: voiceRow.formatting_rules ?? DEFAULT_VOICE_CONFIG.formattingRules,
    };
  } catch {
    return DEFAULT_VOICE_CONFIG;
  }
}

/**
 * Pulls the opening lines of the most recent drafts so the model can avoid
 * repeating hooks. Returns a ready-to-inject prompt block (empty if none).
 */
export async function getRecentHooksBlock(): Promise<string> {
  const supabase = getSupabaseServer();
  if (!supabase) return "";

  try {
    const { data: recentDrafts } = await supabase
      .from("linkedin_drafts")
      .select("post_content")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentHooks = (recentDrafts ?? [])
      .map((d) => ((d.post_content as string)?.split("\n")[0] ?? "").trim())
      .filter(Boolean);

    if (recentHooks.length === 0) return "";

    return `\n\nDO NOT reuse these recent opening lines:\n${recentHooks
      .map((h, i) => `${i + 1}. "${h}"`)
      .join("\n")}`;
  } catch {
    return "";
  }
}

/**
 * Builds the full system prompt for writing a post in the user's voice.
 * Shared by the workflow generator and the legacy generator so there is one
 * source of truth for voice.
 */
export function buildPostSystemPrompt(
  config: VoiceConfig,
  recentHooksBlock = "",
  extraInstructions = ""
): string {
  const voicePrompt = buildVoicePrompt(config);

  return `You are a LinkedIn ghostwriter. Your only job is to write one scroll-stopping post in the author's exact voice.

${voicePrompt}
${recentHooksBlock}

POST STRUCTURE (loose — follow the voice, not a template):
- Hook: 1-2 short lines that make it impossible NOT to read line three.
- Body: short punchy paragraphs that deliver on the hook. Concrete and specific.
- Close: one gut-punch line or a sharp question that pulls comments.
- Do NOT write a "here's what this post covers" summary. Just deliver.
${extraInstructions}

Return ONLY the post text. No labels, no "Hook:", no quotes around it, no commentary.`;
}
