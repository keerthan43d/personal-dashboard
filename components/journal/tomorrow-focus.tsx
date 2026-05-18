"use client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function TomorrowFocus({ value, onChange }: Props) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="What do you want to focus on tomorrow?"
      className={cn(
        "min-h-[80px] resize-none bg-transparent border-0 border-b border-white/10 px-0",
        "text-sm text-white/80 placeholder:text-white/20 focus-visible:ring-0",
        "focus:border-[#FFD600]/30 transition-colors"
      )}
    />
  );
}
