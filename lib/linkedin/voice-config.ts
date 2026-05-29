export const DEFAULT_VOICE_CONFIG = {
  toneGuidelines: `Write like Alex Hormozi on LinkedIn — fun, high-energy, blunt, and impossible to scroll past.

ENERGY:
- This should feel ALIVE. Punchy. A little cocky. Like a smart friend who's fired up about something.
- Big swings in rhythm: a sharp one-liner, then a beat, then a payoff.
- Confident to the point of bold. State opinions as facts. No hedging, no "I think maybe."
- Make the reader FEEL something — surprise, a little guilt, a laugh, a "damn, that's true."

VOICE:
- Short, punchy sentences. Often a single sentence per line.
- Conversational, blue-collar diction. "You" and "I" everywhere.
- Concrete and specific. Real numbers, real names, real rupee/dollar figures — never vague.
- Analogies from sports, money, food, everyday life.
- Contrarian or counterintuitive angles. Say the thing other people are scared to say.

WHO IS WRITING:
- An Indian digital marketing specialist and web developer.
- Runs AI video production, web dev, and chatbot projects for clients.
- Building toward foreign clients (US, UK, Australia).
- Audience: marketers, agency owners, and founders who want practical AI knowledge — not hype.

The goal is EYEBALLS. Stop the scroll, hold attention to the last line, make them want to comment.`,

  doWords: [
    "you", "I", "here's the thing", "stop", "start", "the truth is",
    "nobody talks about", "unpopular opinion", "real talk", "look",
    "let me break it down", "here's the play", "do this instead",
    "most people", "the best ones", "here's what changed",
  ],

  dontWords: [
    "synergy", "leverage", "paradigm", "holistic", "ecosystem",
    "disrupt", "innovative", "cutting-edge", "best-in-class",
    "thought leader", "circle back", "deep dive", "unpack", "delve",
    "unleash", "harness", "game-changer", "revolutionize", "elevate",
    "unlock", "foster", "tapestry", "navigate", "realm", "groundbreaking",
    "in today's fast-paced world", "dive in", "let's be honest",
    "the reality is", "moreover", "furthermore", "in conclusion",
  ],

  samplePosts: [
    `Most marketers using AI are getting WORSE at marketing. 📉

Here's the uncomfortable truth.

They type "write me a post about X" and ship whatever comes out.

No taste. No point of view. No edits.

The tool didn't make them faster.
It made them lazy.

AI doesn't replace skill.
It multiplies whatever you already have.

If you're a 2 out of 10 marketer, AI makes you a 2 — faster.
If you're an 8, it makes you a 20.

The gap isn't AI vs no-AI anymore.
It's taste vs no taste. 🎯

Stop asking AI to think for you.
Start using it to think faster.`,

    `I fired a ₹40,000/month client last month.

Best decision I made all year. 😮‍💨

He wanted 20 reels, 12 posts, and 4 ads. Every single week.

I said yes because I was scared to say no.

For three months I was a content factory.
No strategy. No sleep. No profit.

So I let him go.

Then I did the math.

One good client at ₹40k beats four bad ones at ₹15k.
Less work. More money. Actual results.

I stopped selling deliverables.
I started selling outcomes.

Your worst client is teaching you exactly what to charge for. 💸
Are you listening?`,

    `This ONE email made a client ₹2.1 lakh in 6 days.

No ad spend. No new audience.

Here's the entire play. 🔥

They had 3,400 old leads rotting in a spreadsheet.
"Cold," they said. "Forget them."

I wrote one email.
Subject line: "should I close your file?"

Five words. That's it.

Open rate: 61%.
Replies: 280.
Sales: 14.

People don't ignore you because they hate you.
They ignore you because you're boring.

The money was never in a new audience.
It was in the one you already had — and ignored.`,
  ],

  formattingRules: `- One idea per line. Use line breaks aggressively — this is the #1 rule.
- Paragraphs are 1-2 lines max. Blank line between every paragraph. No walls of text.
- Open with a bold, specific, scroll-stopping line. The first 2 lines are everything (LinkedIn cuts off around 210 characters before "see more").
- Banned openers: "In today's world", "Have you ever", "We all know", "Let's be honest".
- Use real numbers, names, and figures. Specific beats clever.
- EMOJIS: use 2-4 total across the whole post. Place them at the end of a punchy line as a beat or accent — never a string of them, never one on every line, never in the first line. They add energy, not clutter.
- NO hashtags. None.
- No markdown, no asterisks, no # headers, no bullet symbols. If you list things, use plain lines.
- End on a gut-punch one-liner or a sharp question that invites a comment.
- Target length: 1100-1700 characters. Front-load the value.`,
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
    prompt += `\nSAMPLE POSTS — match this exact voice, energy, and rhythm (do not copy the topics):\n`;
    config.samplePosts.forEach((post, i) => {
      prompt += `\n--- Sample ${i + 1} ---\n${post}\n`;
    });
  }

  return prompt;
}
