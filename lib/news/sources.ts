// News sources — curated free RSS feeds (India + global mix).
// $0: no API key, no per-request cost. Fetched server-side, so no CORS.
// To add a source: drop its RSS URL into the right category's `feeds`.

export interface NewsCategory {
  id: string;
  label: string;
  feeds: string[];
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    id: "ai",
    label: "AI News",
    feeds: [
      "https://techcrunch.com/category/artificial-intelligence/feed/",
      "https://venturebeat.com/category/ai/feed/",
      "https://www.marktechpost.com/feed/",
      "https://www.theverge.com/rss/index.xml",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    feeds: [
      "https://www.marketingdive.com/feeds/news/",
      "https://www.searchenginejournal.com/feed/",
      "https://contentmarketinginstitute.com/feed/",
      "https://www.socialmediatoday.com/feeds/news/",
    ],
  },
  {
    id: "startups",
    label: "Startups",
    feeds: [
      "https://inc42.com/feed/",
      "https://yourstory.com/feed",
      "https://techcrunch.com/category/startups/feed/",
    ],
  },
  {
    id: "research",
    label: "Research Papers",
    // arXiv's plain RSS is empty on non-publishing days; the API query feed
    // (Atom) is always populated and sorted newest-first.
    feeds: [
      "http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=20",
      "http://export.arxiv.org/api/query?search_query=cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=15",
      "http://export.arxiv.org/api/query?search_query=cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=15",
    ],
  },
  {
    id: "business",
    label: "Global Business",
    feeds: [
      "https://feeds.bbci.co.uk/news/business/rss.xml",
      "https://www.cnbc.com/id/10001147/device/rss/rss.html",
      "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
    ],
  },
];

export function getCategory(id: string): NewsCategory | undefined {
  return NEWS_CATEGORIES.find((c) => c.id === id);
}
