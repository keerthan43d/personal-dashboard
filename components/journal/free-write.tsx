"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function FreeWrite({ value, onChange, placeholder = "Write anything. This is yours." }: Props) {
  const [preview, setPreview] = useState(false);
  const [focused, setFocused] = useState(false);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className={cn(
        "border transition-all duration-200",
        focused
          ? "border-[#FFD600]/40 bg-[#FFD600]/[0.015]"
          : "border-white/10 bg-white/[0.02]"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
        <div className="flex items-center gap-3">
          {charCount > 0 ? (
            <>
              <span className="text-[8px] font-black tracking-[0.1em] uppercase text-white/70">
                {wordCount}w
              </span>
              <span className="text-[8px] font-black tracking-[0.1em] uppercase text-white/55">
                {charCount}c
              </span>
            </>
          ) : (
            <span className="text-[8px] font-black tracking-[0.1em] uppercase text-white/55">
              Empty
            </span>
          )}
        </div>
        <button
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1.5 text-[8px] font-black tracking-[0.12em] uppercase text-white/70 hover:text-white/60 transition-colors cursor-pointer"
        >
          {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[200px] text-sm text-white/75 leading-relaxed p-4 whitespace-pre-wrap">
          {value || <span className="text-white/55 italic">Nothing written yet.</span>}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full min-h-[200px] resize-none bg-transparent px-4 py-4",
            "text-sm text-white/85 placeholder:text-white/55",
            "outline-none border-none focus:outline-none",
            "leading-relaxed"
          )}
        />
      )}
    </div>
  );
}
