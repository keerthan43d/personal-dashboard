"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function FreeWrite({ value, onChange, placeholder = "Write anything. This is yours." }: Props) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setPreview((p) => !p)}
        className="absolute top-0 right-0 flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase text-white/25 hover:text-white/50 transition-colors"
      >
        {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {preview ? "Edit" : "Preview"}
      </button>

      {preview ? (
        <div
          className={cn(
            "min-h-[200px] text-sm text-white/70 leading-relaxed pt-1",
            "whitespace-pre-wrap border-b border-white/10 pb-4"
          )}
        >
          {value || <span className="text-white/20 italic">Nothing written yet.</span>}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "min-h-[200px] resize-none bg-transparent border-0 border-b border-white/10 px-0",
            "text-sm text-white/80 placeholder:text-white/20 focus-visible:ring-0",
            "focus:border-[#FFD600]/30 transition-colors"
          )}
        />
      )}
    </div>
  );
}
