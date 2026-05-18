"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function TomorrowFocus({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "border transition-all duration-200",
        focused
          ? "border-[#FFD600]/40 bg-[#FFD600]/[0.015]"
          : "border-white/10 bg-white/[0.02]"
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="What's the one thing you want to focus on tomorrow?"
        className={cn(
          "w-full min-h-[80px] resize-none bg-transparent px-4 py-3",
          "text-sm text-white/85 placeholder:text-white/22",
          "outline-none border-none focus:outline-none",
          "leading-relaxed"
        )}
      />
    </div>
  );
}
