// Hands a news article from the News tab to the Content workflow as research.
// Uses sessionStorage so no backend is involved — one-shot, cleared on read.

export const NEWS_SEED_KEY = "cc_news_seed";

export interface NewsSeed {
  title: string; // article headline → becomes the workflow "angle"
  category: string; // category label → becomes the workflow "topic"
  research: string; // AI-enriched research the post is grounded on
  link?: string;
  source?: string;
}

export function stashNewsSeed(seed: NewsSeed): void {
  try {
    sessionStorage.setItem(NEWS_SEED_KEY, JSON.stringify(seed));
  } catch {
    /* sessionStorage unavailable — non-fatal */
  }
}

export function takeNewsSeed(): NewsSeed | null {
  try {
    const raw = sessionStorage.getItem(NEWS_SEED_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(NEWS_SEED_KEY);
    return JSON.parse(raw) as NewsSeed;
  } catch {
    return null;
  }
}
