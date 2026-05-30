// Minimal RSS 2.0 / RSS 1.0 (RDF) / Atom parser — no dependency.
// Fetched server-side with a short in-memory cache so repeat visits are free
// and instant.

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null; // ISO
  snippet: string;
  category: string;
}

// ── tiny helpers ──────────────────────────────────────────────────
function stripCData(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function clean(raw: string | null, max = 280): string {
  if (!raw) return "";
  let t = stripCData(raw);
  // Feed summaries often carry ESCAPED html (&lt;figure&gt;…). Decode first so
  // those become real tags, then strip. Repeat to catch double-escaped feeds.
  for (let i = 0; i < 2; i++) {
    t = decodeEntities(t);
    t = t.replace(/<[^>]+>/g, " ");
  }
  t = decodeEntities(t); // final pass for plain text entities (&amp;, &#039;…)
  t = t.replace(/\s+/g, " ").trim();
  if (t.length > max) t = t.slice(0, max).trimEnd() + "…";
  return t;
}

function firstTag(block: string, tags: string[]): string | null {
  for (const tag of tags) {
    const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
    if (m) return m[1];
  }
  return null;
}

function extractLink(block: string): string {
  // Atom: <link href="..."/> (prefer rel="alternate" or no rel)
  const atom = [...block.matchAll(/<link\b([^>]*)\/?>/gi)];
  if (atom.length) {
    const alt = atom.find((m) => /rel=["']?alternate/i.test(m[1])) ?? atom[0];
    const href = alt[1].match(/href=["']([^"']+)["']/i);
    if (href) return decodeEntities(href[1]);
  }
  // RSS: <link>...</link>
  const rss = firstTag(block, ["link"]);
  if (rss) return decodeEntities(stripCData(rss).trim());
  return "";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function parseFeed(xml: string, category: string): NewsItem[] {
  const blocks = [
    ...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);

  const items: NewsItem[] = [];
  for (const block of blocks) {
    const title = clean(firstTag(block, ["title"]), 200);
    const link = extractLink(block);
    if (!title || !link) continue;

    const dateRaw = firstTag(block, ["pubDate", "dc:date", "published", "updated", "date"]);
    let publishedAt: string | null = null;
    if (dateRaw) {
      const d = new Date(stripCData(dateRaw).trim());
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    const snippet = clean(firstTag(block, ["description", "summary", "content"]), 280);

    items.push({
      title,
      link,
      source: hostname(link),
      publishedAt,
      snippet,
      category,
    });
  }
  return items;
}

// ── fetching + cache ──────────────────────────────────────────────
const CACHE_TTL_MS = 1000 * 60 * 90; // 90 min
const cache = new Map<string, { ts: number; items: NewsItem[] }>();

async function fetchOne(url: string, category: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CommandChamber/1.0; +https://example.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, category);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch + merge all feeds for a category, newest first. Cached in memory. */
export async function getCategoryNews(
  categoryId: string,
  feeds: string[],
  limit = 40
): Promise<NewsItem[]> {
  const hit = cache.get(categoryId);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.items.slice(0, limit);

  const results = await Promise.allSettled(feeds.map((f) => fetchOne(f, categoryId)));
  const merged = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // dedup by link
  const seen = new Set<string>();
  const deduped = merged.filter((it) => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });

  deduped.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  cache.set(categoryId, { ts: Date.now(), items: deduped });
  return deduped.slice(0, limit);
}
