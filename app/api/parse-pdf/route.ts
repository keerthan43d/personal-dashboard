import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import keeps pdf-parse out of Next.js's static module graph.
    // pdf-parse v2 exposes a PDFParse class (no default export).
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    let text = "";
    let pages = 0;
    try {
      const result = await parser.getText();
      text = result.text?.trim() ?? "";
      pages = result.total;
    } finally {
      await parser.destroy();
    }

    if (!text) {
      return NextResponse.json({ error: "Could not extract text from PDF (may be scanned/image-only)" }, { status: 422 });
    }

    return NextResponse.json({ text, pages });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF parse failed" },
      { status: 500 }
    );
  }
}
