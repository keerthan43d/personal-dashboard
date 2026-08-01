"use client";
import { motion } from "framer-motion";

interface Props {
  value: number;   // 0..max
  max?: number;    // default 10
  color: string;
  compact?: boolean;
}

/**
 * Constructivist 10-cell rating meter. Filled cells burn in with the accent
 * colour; empty cells are hairline-bordered voids. No soft edges, no glow.
 */
export function SegmentMeter({ value, max = 10, color, compact }: Props) {
  const cells = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className={`flex ${compact ? "gap-[3px]" : "gap-1"} w-full`}>
      {cells.map((n) => {
        const on = n <= value;
        const isEdge = n === value; // leading cell
        return (
          <motion.div
            key={n}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.18, delay: on ? n * 0.03 : 0, ease: "linear" }}
            style={{
              background: on ? color : "rgba(255,255,255,0.04)",
              boxShadow: isEdge ? `0 0 0 1px ${color}` : undefined,
              borderTop: on ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderBottom: on ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
            className={`flex-1 origin-bottom ${compact ? "h-2" : "h-3.5"}`}
          />
        );
      })}
    </div>
  );
}
