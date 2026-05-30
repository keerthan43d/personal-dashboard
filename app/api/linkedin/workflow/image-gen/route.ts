import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

type ImageStyle = "editorial" | "minimalist" | "statement" | "beeple" | "custom";

function pickModel(style: ImageStyle): string {
  if (style === "beeple") return DEFAULT_MODELS.imageBeeple;
  return DEFAULT_MODELS.imageMinimalist;
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  const choices = data.choices as Array<{ message: Record<string, unknown> }> | undefined;
  const msg = choices?.[0]?.message;

  if (!msg) return null;

  // Gemini format: msg.images[]
  const images = msg.images as Array<{ image_url?: { url?: string }; url?: string }> | undefined;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (img.image_url?.url) return img.image_url.url;
      if (img.url) return img.url;
    }
  }

  // Content array format
  const content = msg.content;
  if (Array.isArray(content)) {
    for (const part of content as Array<Record<string, unknown>>) {
      if (part.type === "image_url") {
        const iu = part.image_url as { url?: string } | undefined;
        if (iu?.url) return iu.url;
      }
      const id = part.inline_data as { data?: string; mime_type?: string } | undefined;
      if (id?.data) {
        const mime = id.mime_type ?? "image/png";
        return `data:${mime};base64,${id.data}`;
      }
    }
  }

  // String content — look for data URL or https URL
  if (typeof content === "string") {
    const b64 = content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
    if (b64) return b64[0];
    const url = content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp)/i);
    if (url) return url[0];
  }

  // Some OpenRouter image models return data[] at top level
  const dataArr = data.data as Array<{ url?: string; b64_json?: string }> | undefined;
  if (Array.isArray(dataArr)) {
    for (const item of dataArr) {
      if (item.url) return item.url;
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const { prompt, style } = await req.json() as {
      prompt: string;
      style: ImageStyle;
    };

    const model = pickModel(style);

    // LinkedIn portrait gives the most feed real estate
    const fullPrompt = `${prompt.trim()} Portrait 4:5 aspect ratio (1080x1350), vertical composition.`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: fullPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json() as Record<string, unknown>;
    const imageUrl = extractImageUrl(data);

    if (!imageUrl) {
      console.error("image-gen: could not extract image. Response keys:", Object.keys(data));
      return NextResponse.json(
        { error: "No image returned from model" },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
