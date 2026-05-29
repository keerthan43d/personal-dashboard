// Proven LinkedIn hook archetypes — the swipe file the model draws from.
// Each entry teaches the model a *shape*, not a topic.

export interface HookArchetype {
  name: string;
  idea: string;
  example: string;
}

export const HOOK_ARCHETYPES: HookArchetype[] = [
  {
    name: "Contrarian",
    idea: "Attack a belief the audience holds. Say the opposite of the obvious.",
    example: "Most marketers using AI are getting WORSE at marketing.",
  },
  {
    name: "Number-shock",
    idea: "Lead with one surprising, specific number and an outcome.",
    example: "This one email made a client ₹2.1 lakh in 6 days.",
  },
  {
    name: "Confession / Loss",
    idea: "Admit a mistake or loss, then flip it into the best thing that happened.",
    example: "I fired a ₹40,000/month client last month. Best decision all year.",
  },
  {
    name: "Callout",
    idea: "Name the exact person this is for so they feel seen.",
    example: "If you're posting every day and getting 4 likes, read this.",
  },
  {
    name: "Earned lesson",
    idea: "\"I did the painful thing so you don't have to.\"",
    example: "I wasted ₹3 lakh on ads to learn what I'll tell you in 30 seconds.",
  },
  {
    name: "Enemy / lazy default",
    idea: "Call out the lazy thing everyone does, then promise the better way.",
    example: "Stop boosting posts. It's the fastest way to burn money on LinkedIn.",
  },
  {
    name: "Before / after",
    idea: "Sharp transformation with a concrete gap.",
    example: "Same product. Same audience. One word change took it from 2% to 19%.",
  },
  {
    name: "Open loop",
    idea: "Promise a specific payoff and withhold it so they must keep reading.",
    example: "There's one line in every cold email that decides if you get the reply.",
  },
  {
    name: "Brutal truth",
    idea: "State an uncomfortable fact as plain fact, no hedging.",
    example: "Nobody is ignoring you because you're bad. They're ignoring you because you're boring.",
  },
  {
    name: "Pattern-interrupt question",
    idea: "A sharp, specific question — never a generic 'Have you ever?'",
    example: "Why does your worst client always want the most work for the least money?",
  },
];

export function buildHookSwipeBlock(): string {
  const lines = HOOK_ARCHETYPES.map(
    (a) => `- ${a.name}: ${a.idea}\n  e.g. "${a.example}"`
  ).join("\n");
  return `HOOK ARCHETYPES (proven shapes — pick the best fit, never copy the examples):\n${lines}`;
}
