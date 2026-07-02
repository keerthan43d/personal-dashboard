"use client";
import { useState } from "react";
import {
  Archive, ChevronDown, Landmark, Coins, Trash2,
  ArrowDownRight, ArrowUpRight,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useExpensesStore } from "./expenses-store";
import type { ExpenseArchive, ArchivedTxn } from "@/lib/db/expenses-repository";

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE · dd MMM") : iso;
}

function ArchivedRow({ txn }: { txn: ArchivedTxn }) {
  const isBank = txn.account === "bank";
  const isIncome = txn.type === "income";
  return (
    <div className="flex items-center gap-3 border border-white/8 bg-white/[0.02] px-3 py-2">
      <span
        className="flex items-center gap-1 text-[8px] font-black tracking-[0.08em] uppercase px-1.5 py-1 border shrink-0"
        style={{
          color: isBank ? "#FFD600" : "#00C9A7",
          borderColor: isBank ? "rgba(255,214,0,0.4)" : "rgba(0,201,167,0.4)",
        }}
      >
        {isBank ? <Landmark className="w-2.5 h-2.5" /> : <Coins className="w-2.5 h-2.5" />}
        {txn.account}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white/90 truncate">{txn.description}</p>
        <p className="text-[9px] text-white/30 mt-0.5 truncate uppercase tracking-[0.08em] font-bold">
          {fmtDate(txn.spentAt)}{txn.category ? ` · ${txn.category}` : ""}
        </p>
      </div>
      <span
        className="text-[13px] font-mono font-bold tabular-nums shrink-0"
        style={{ color: isIncome ? "#2ECC71" : "#FF5C5C" }}
      >
        {isIncome ? "+" : "−"}{formatMoney(txn.amount)}
      </span>
    </div>
  );
}

function ArchiveCard({ archive }: { archive: ExpenseArchive }) {
  const [open, setOpen] = useState(false);
  const removeArchive = useExpensesStore((s) => s.removeArchive);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border border-white/8 bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer group"
        >
          <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform shrink-0", open && "rotate-180")} />
          <div className="min-w-0">
            <p className="text-[13px] font-black tracking-[0.06em] uppercase text-[#FFD600] truncate">
              {archive.label}
            </p>
            <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/30 mt-0.5">
              {archive.txnCount} {archive.txnCount === 1 ? "TXN" : "TXNS"} · CLOSED {fmtDate(archive.createdAt.slice(0, 10))}
            </p>
          </div>
        </button>

        {/* Totals */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#2ECC71] tabular-nums">
            <ArrowUpRight className="w-3 h-3" />{formatMoney(archive.incomeTotal)}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#FF5C5C] tabular-nums">
            <ArrowDownRight className="w-3 h-3" />{formatMoney(archive.expenseTotal)}
          </span>
        </div>

        <button
          onClick={() => {
            if (confirming) removeArchive(archive.id);
            else { setConfirming(true); setTimeout(() => setConfirming(false), 3000); }
          }}
          className={cn(
            "shrink-0 transition-colors",
            confirming ? "text-[#E60012]" : "text-white/20 hover:text-[#E60012]"
          )}
          aria-label="Delete this archived month permanently"
          title={confirming ? "Click again to delete" : "Delete archive"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Closing balances + transactions */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/8 pt-3">
          <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-[0.1em] uppercase">
            <span className="px-2 py-1 border border-white/10 text-white/50">
              BANK CLOSED · <span className="text-white/80 font-mono">{formatMoney(archive.bankClosing)}</span>
            </span>
            <span className="px-2 py-1 border border-white/10 text-white/50">
              CASH CLOSED · <span className="text-white/80 font-mono">{formatMoney(archive.cashClosing)}</span>
            </span>
          </div>

          {archive.transactions.length === 0 ? (
            <p className="text-[10px] text-white/25 font-mono py-2">No transactions were recorded this month.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {archive.transactions.map((t, i) => (
                <ArchivedRow key={i} txn={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PreviousView() {
  const archives = useExpensesStore((s) => s.archives);

  if (archives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Archive className="w-8 h-8 text-white/10" strokeWidth={1.5} />
        <p className="text-[11px] font-black tracking-[0.12em] uppercase text-white/20">
          No previous months yet
        </p>
        <p className="text-[10px] text-white/15 font-mono text-center max-w-xs">
          When a month ends (or you hit Reset Month), your data gets archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {archives.map((a) => (
        <ArchiveCard key={a.id} archive={a} />
      ))}
    </div>
  );
}
