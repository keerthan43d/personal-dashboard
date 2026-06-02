"use client";
import { cn } from "@/lib/utils";

type TagChipProps = {
  name: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "xs";
};

export function TagChip({ name, color, active, onClick, onRemove, size = "sm" }: TagChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 border transition-all duration-150",
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
        "font-black tracking-[0.1em] uppercase",
        onClick ? "cursor-pointer" : "cursor-default",
        active
          ? "text-black"
          : "bg-transparent text-white/60 hover:text-white hover:border-white/30"
      )}
      style={
        active
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: `${color}40` }
      }
    >
      <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: active ? "rgba(0,0,0,0.5)" : color }} />
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 text-current opacity-60 hover:opacity-100 leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
