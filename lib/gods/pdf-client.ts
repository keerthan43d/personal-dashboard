"use client";

/**
 * Extract text from a PDF entirely in the browser using pdf.js.
 * Avoids uploading the binary to the server (Vercel functions cap request
 * bodies at ~4.5 MB, which most book PDFs exceed). Only the extracted text
 * is sent onward.
 */
export async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  // Worker must match the installed version — pull it from a versioned CDN.
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const pages = doc.numPages;

  let text = "";
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => {
        const str = (it as { str?: unknown }).str;
        return typeof str === "string" ? str : "";
      })
      .join(" ");
    text += line + "\n\n";
  }

  await loadingTask.destroy();
  return { text: text.trim(), pages };
}
