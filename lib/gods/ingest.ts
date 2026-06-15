const CHUNK_WORDS = 750;
const OVERLAP_WORDS = 80;

export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORDS, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.length > 40) chunks.push(chunk);
    if (end >= words.length) break;
    start = end - OVERLAP_WORDS;
  }

  return chunks;
}
