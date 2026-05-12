"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  max?: number;
  size?: "sm" | "md";
  onRate?: (n: number) => void;
  readonly?: boolean;
}

export function StarRating({ value = 0, max = 5, size = "sm", onRate, readonly }: StarRatingProps) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly || !onRate}
            onClick={() => onRate?.(i + 1)}
            className={cn(
              "transition-colors",
              !readonly && onRate ? "cursor-pointer hover:scale-110" : "cursor-default"
            )}
          >
            <Star
              className={cn(sz, filled ? "fill-cyan-400 text-cyan-400" : "text-zinc-700")}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
