"use client";
import { Landmark, Coins, Wallet, Pencil } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { useExpensesStore } from "./expenses-store";

type Props = { onEdit: () => void };

export function BalanceCards({ onEdit }: Props) {
  const balance = useExpensesStore((s) => s.balance);

  const bank = balance?.bank ?? 0;
  const cash = balance?.cash ?? 0;
  const total = bank + cash;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Total */}
      <div className="relative border border-white/8 bg-white/[0.018] card-hover">
        <div className="flex items-center gap-0 border-b border-white/8">
          <div className="w-0.5 self-stretch bg-[#FFD600]" />
          <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-[#FFD600]" />
            TOTAL MONEY
          </span>
          <button
            onClick={onEdit}
            className="ml-auto mr-3 flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase text-white/35 hover:text-[#FFD600] transition-colors"
          >
            <Pencil className="w-3 h-3" />
            EDIT
          </button>
        </div>
        <div className="px-4 py-5">
          <p className="text-[28px] leading-none font-mono font-bold text-[#FFD600] tabular-nums">
            {formatMoney(total)}
          </p>
        </div>
      </div>

      {/* Bank */}
      <div className="border border-white/8 bg-white/[0.018] card-hover">
        <div className="flex items-center gap-0 border-b border-white/8">
          <div className="w-0.5 self-stretch bg-white/30" />
          <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white/70 flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5 text-white/50" />
            BANK
          </span>
        </div>
        <div className="px-4 py-5">
          <p className="text-[22px] leading-none font-mono font-bold text-white tabular-nums">
            {formatMoney(bank)}
          </p>
        </div>
      </div>

      {/* Cash */}
      <div className="border border-white/8 bg-white/[0.018] card-hover">
        <div className="flex items-center gap-0 border-b border-white/8">
          <div className="w-0.5 self-stretch bg-[#00C9A7]" />
          <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white/70 flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-[#00C9A7]" />
            CASH
          </span>
        </div>
        <div className="px-4 py-5">
          <p className="text-[22px] leading-none font-mono font-bold text-white tabular-nums">
            {formatMoney(cash)}
          </p>
        </div>
      </div>
    </div>
  );
}
