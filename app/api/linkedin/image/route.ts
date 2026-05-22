import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { DEFAULT_IMAGE_STYLE_SUFFIX } from "@/lib/linkedin/voice-config";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const supabase = getSupabaseServer();
    const { headline, postContent } = (await req.json()) as {
      headline: string;
      postContent: string;
    };

    const { data: styleRow } = await supabase
      .from("linkedin_image_style")
      .select("style_suffix")
      .limit(1)
      .maybeSingle();

    const styleSuffix = styleRow?.style_suffix ?? DEFAULT_IMAGE_STYLE_SUFFIX;

    const prompt = `Generate an image for a LinkedIn post about: "${headline}"

Post context: ${postContent.slice(0, 300)}

Style requirements: ${styleSuffix}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODELS.image,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${err}`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;

    console.log("Full OpenRouter response:", JSON.stringify(data, null, 2).slice(0, 2000));

    if (!msg) {
      return NextResponse.json({ error: "No message in response" }, { status: 502 });
    }

    // Gemini returns images in msg.images[] array
    if (Array.isArray(msg.images)) {
      for (const img of msg.images) {
        if (img.image_url?.url) {
          return NextResponse.json({ imageUrl: img.image_url.url });
        }
        if (img.url) {
          return NextResponse.json({ imageUrl: img.url });
        }
      }
    }

    // Fallback: check content array for image parts
    const content = msg.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image_url" && part.image_url?.url) {
          return NextResponse.json({ imageUrl: part.image_url.url });
        }
        if (part.inline_data?.data) {
          const mime = part.inline_data.mime_type ?? "image/png";
          return NextResponse.json({
            imageUrl: `data:${mime};base64,${part.inline_data.data}`,
          });
        }
      }
    }

    // Fallback: check string content for base64
    if (typeof content === "string") {
      const b64 = content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (b64) return NextResponse.json({ imageUrl: b64[0] });
    }

    console.error("Could not extract image. Keys:", Object.keys(msg));

    return NextResponse.json(
      { error: "No image returned from model" },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
