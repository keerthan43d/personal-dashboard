"use client";
import { useState, useEffect } from "react";
import { Landmark, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExpensesStore } from "./expenses-store";

type Props = { open: boolean; onClose: () => void };

export function EditBalanceDialog({ open, onClose }: Props) {
  const { balance, updateBalance } = useExpensesStore();
  const [bank, setBank] = useState("");
  const [cash, setCash] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && balance) {
      setBank(String(balance.bank));
      setCash(String(balance.cash));
    }
  }, [open, balance]);

  const handleSave = async () => {
    const bankVal = parseFloat(bank);
    const cashVal = parseFloat(cash);
    if (Number.isNaN(bankVal) || Number.isNaN(cashVal)) return;
    setSaving(true);
    try {
      await updateBalance({ bank: bankVal, cash: cashVal });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#080808] border border-white/10 text-white max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-white/8">
          <DialogTitle className="text-[12px] font-black tracking-[0.14em] uppercase text-white">
            SET BALANCE
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#FFD600]" />
              BANK BALANCE
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[13px] font-mono">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 pl-7 pr-3 py-2 text-[13px] font-mono text-white outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#00C9A7]" />
              CASH BALANCE
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[13px] font-mono">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 pl-7 pr-3 py-2 text-[13px] font-mono text-white outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-0 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white hover:bg-white/[0.03] transition-all border-r border-white/8"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 hover:bg-white transition-colors"
          >
            {saving ? "SAVING..." : "SAVE BALANCE"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
