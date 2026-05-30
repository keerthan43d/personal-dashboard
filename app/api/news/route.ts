import { NextRequest, NextResponse } from "next/server";
import { NEWS_CATEGORIES, getCategory } from "@/lib/news/sources";
import { getCategoryNews } from "@/lib/news/rss";

// RSS fetching can take a few seconds across several feeds.
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get("category") ?? NEWS_CATEGORIES[0].id;
    const category = getCategory(categoryId);
    if (!category) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }

    const items = await getCategoryNews(category.id, category.feeds);
    return NextResponse.json({
      category: { id: category.id, label: category.label },
      items,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load news" },
      { status: 500 }
    );
  }
}
