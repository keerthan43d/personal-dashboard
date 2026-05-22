export const DEFAULT_VOICE_CONFIG = {
  toneGuidelines: `Write like Alex Hormozi on LinkedIn. Core principles:

- Short, punchy sentences. Often single-sentence paragraphs.
- Aggressive line breaks — almost every sentence gets its own line.
- Direct, opinionated, no hedging. State things as fact even when they're opinion.
- Hook formulas: contrarian claim, bold number, brutal truth, common mistake call-out.
- Frameworks and numbered lists for educational posts.
- Conversational, blue-collar diction. "You" and "I" everywhere. No corporate buzzwords.
- Posts often end with a one-line gut-punch summary or a CTA-style line.
- Liberal use of analogies, especially from sports, business, and everyday life.
- Zero emojis. Zero hashtag spam (1-3 max, contextual).
- Target length: 1300-1900 characters.`,

  doWords: [
    "you", "I", "most people", "here's the thing", "stop", "start",
    "the truth is", "nobody talks about", "unpopular opinion",
    "let me break it down", "real talk", "game changer",
  ],

  dontWords: [
    "synergy", "leverage", "paradigm", "holistic", "ecosystem",
    "disrupt", "innovative", "cutting-edge", "best-in-class",
    "thought leader", "circle back", "deep dive", "unpack",
  ],

  samplePosts: [],

  formattingRules: `- One sentence per line. Use line breaks aggressively.
- No bullet points with symbols. Use numbered lists or plain dashes.
- Bold claims up front. Evidence after.
- End with a gut-punch one-liner or a simple question.
- Never use emojis.
- Keep paragraphs to 1-2 sentences max.`,
};

export const DEFAULT_IMAGE_STYLE_SUFFIX =
  "Clean minimalist style. Royal purple and white color palette with Poppins-style modern typography feel. Minimal composition. Conceptual, not literal. Professional, modern, suitable for LinkedIn business feed. No text in image. No people's faces. Single focal subject.";

export function buildVoicePrompt(config: {
  toneGuidelines: string;
  doWords: string[];
  dontWords: string[];
  samplePosts: string[];
  formattingRules: string;
}): string {
  let prompt = `=== VOICE RULEBOOK ===\n\n`;
  prompt += `TONE GUIDELINES:\n${config.toneGuidelines}\n\n`;
  prompt += `WORDS/PHRASES TO USE: ${config.doWords.join(", ")}\n\n`;
  prompt += `WORDS/PHRASES TO AVOID: ${config.dontWords.join(", ")}\n\n`;
  prompt += `FORMATTING RULES:\n${config.formattingRules}\n`;

  if (config.samplePosts.length > 0) {
    prompt += `\nSAMPLE POSTS (match this voice):\n`;
    config.samplePosts.forEach((post, i) => {
      prompt += `\n--- Sample ${i + 1} ---\n${post}\n`;
    });
  }

  return prompt;
}
