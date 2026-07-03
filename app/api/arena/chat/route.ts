import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter } from "@/lib/linkedin/openrouter";

export const maxDuration = 60;

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 503 });
  }

  const { model, messages } = await req.json() as {
    model: string;
    messages: Message[];
  };

  if (!model?.trim()) {
    return NextResponse.json({ error: "No model selected" }, { status: 400 });
  }

  const openrouter = getOpenRouter();

  let stream: Awaited<ReturnType<typeof openrouter.chat.completions.create>>;
  try {
    stream = await openrouter.chat.completions.create({
      model,
      messages,
      stream: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) controller.enqueue(encoder.encode(content));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream error";
        controller.enqueue(encoder.encode(`\n\n[stream error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
