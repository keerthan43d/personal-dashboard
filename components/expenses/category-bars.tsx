"use client";
import { formatMoney } from "@/lib/utils/format";

type Props = {
  title: string;
  /** category name → total spent */
  categories: Record<string, number>;
};

export function CategoryBars({ title, categories }: Props) {
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="border border-white/8 bg-white/[0.018]">
      <div className="flex items-center gap-0 border-b border-white/8">
        <div className="w-0.5 self-stretch bg-[#FFD600]" />
        <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white/70">
          {title}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        {entries.length === 0 ? (
          <p className="text-[11px] text-white/25 font-mono">No expenses in this period.</p>
        ) : (
          entries.map(([cat, value]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-[11px] text-white/70 font-bold w-24 flex-shrink-0 truncate uppercase tracking-[0.06em]">
                {cat}
              </span>
              <div className="flex-1 h-1.5 bg-white/8 overflow-hidden">
                <div
                  className="h-full bg-[#FFD600]"
                  style={{ width: `${Math.round((value / max) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-white/45 tabular-nums min-w-[60px] text-right">
                {formatMoney(value)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
