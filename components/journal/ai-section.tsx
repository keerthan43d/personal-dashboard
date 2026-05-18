"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { JournalEntry, ProblemLog } from "@/lib/db/schemas";

interface Props {
  entries:  JournalEntry[];
  problems: ProblemLog[];
}

type Mode = "digest" | "reflect" | "ask" | null;

export function AiSection({ entries, problems }: Props) {
  const [mode,    setMode]    = useState<Mode>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<string | null>(null);
  const [question,setQuestion]= useState("");

  async function run(m: Mode) {
    if (!m) return;
    setMode(m);
    setResult(null);
    setLoading(true);

    try {
      const body =
        m === "ask"
          ? { entries, problems, question }
          : { entries, problems };

      const res  = await fetch(`/api/journal/${m === "digest" ? "digest" : m === "reflect" ? "reflect" : "ask"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        setResult(`Error: ${err}`);
        return;
      }

      const data = await res.json();
      setResult(data.result ?? data.digest ?? data.answer ?? "No response.");
    } catch (e) {
      setResult("Failed to connect. Check OPENAI_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("digest")}
          disabled={loading}
          className={cn(
            "text-[10px] font-black tracking-[0.08em] uppercase border-white/15 text-white/50 hover:text-white hover:border-white/30",
            mode === "digest" && result && "border-[#FFD600]/40 text-[#FFD600]/80"
          )}
        >
          Weekly Digest
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("reflect")}
          disabled={loading}
          className={cn(
            "text-[10px] font-black tracking-[0.08em] uppercase border-white/15 text-white/50 hover:text-white hover:border-white/30",
            mode === "reflect" && result && "border-[#FFD600]/40 text-[#FFD600]/80"
          )}
        >
          Monthly Reflection
        </Button>
      </div>

      {/* Ask my journal */}
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && question.trim() && run("ask")}
          placeholder="Ask your journal anything…"
          className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
        />
        <Button
          size="sm"
          onClick={() => run("ask")}
          disabled={loading || !question.trim()}
          className="bg-[#FFD600] text-black hover:bg-[#FFD600]/90 font-black text-[10px] tracking-[0.08em] uppercase flex-shrink-0"
        >
          Ask
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-white/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Thinking…</span>
        </div>
      )}

      {result && !loading && (
        <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap border border-white/8 bg-white/[0.02] p-4">
          {result}
        </pre>
      )}
    </div>
  );
}
