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

    // Dynamic import avoids pdf-parse's module-level fs.readFileSync test-data calls
    // which break Next.js static analysis.
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);

    const text = result.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Could not extract text from PDF (may be scanned/image-only)" }, { status: 422 });
    }

    return NextResponse.json({ text, pages: result.numpages });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF parse failed" },
      { status: 500 }
    );
  }
}
