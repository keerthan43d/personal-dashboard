"use client";
import { useState } from "react";
import { Archive, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExpensesStore } from "./expenses-store";

type Props = { open: boolean; onClose: () => void };

export function ResetDialog({ open, onClose }: Props) {
  const { resetMonth, hardReset } = useExpensesStore();
  const [busy, setBusy] = useState<"soft" | "hard" | null>(null);
  const [confirmHard, setConfirmHard] = useState(false);

  const close = () => {
    setConfirmHard(false);
    onClose();
  };

  const handleSoft = async () => {
    setBusy("soft");
    try {
      await resetMonth();
      toast.success("Month archived to Previous Expenses · balances reset to ₹0");
      close();
    } catch {
      toast.error("Reset failed");
    } finally {
      setBusy(null);
    }
  };

  const handleHard = async () => {
    if (!confirmHard) {
      setConfirmHard(true);
      setTimeout(() => setConfirmHard(false), 4000);
      return;
    }
    setBusy("hard");
    try {
      await hardReset();
      toast.success("Current month wiped · balances reset to ₹0");
      close();
    } catch {
      toast.error("Hard reset failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="bg-[#080808] border border-white/10 text-white max-w-md p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-white/8">
          <DialogTitle className="text-[12px] font-black tracking-[0.14em] uppercase text-white">
            RESET EXPENSES
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          {/* ── Soft reset ── */}
          <div className="border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#FFD600]" />
              <span className="text-[11px] font-black tracking-[0.1em] uppercase text-white">
                RESET MONTH
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Archive this month&apos;s transactions to <span className="text-white/70 font-bold">Previous Expenses</span>,
              then set balances and the list back to ₹0. Nothing is lost — you can view it anytime.
            </p>
            <button
              onClick={handleSoft}
              disabled={busy !== null}
              className="mt-1 w-full py-2.5 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.12em] uppercase disabled:opacity-40 hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              {busy === "soft" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              {busy === "soft" ? "ARCHIVING..." : "ARCHIVE & RESET"}
            </button>
          </div>

          {/* ── Hard reset ── */}
          <div className="border border-[#E60012]/30 bg-[#E60012]/[0.04] p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF5C5C]" />
              <span className="text-[11px] font-black tracking-[0.1em] uppercase text-[#FF5C5C]">
                HARD RESET
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              <span className="text-[#FF5C5C] font-bold">Permanently deletes</span> this month&apos;s transactions
              (no archive) and sets balances to ₹0. This cannot be undone.
            </p>
            <button
              onClick={handleHard}
              disabled={busy !== null}
              className={cnBtn(confirmHard)}
            >
              {busy === "hard" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> WIPING...</>
              ) : confirmHard ? (
                <><AlertTriangle className="w-3.5 h-3.5" /> CLICK AGAIN TO CONFIRM</>
              ) : (
                <><AlertTriangle className="w-3.5 h-3.5" /> DELETE EVERYTHING</>
              )}
            </button>
          </div>
        </div>

        <div className="flex border-t border-white/8">
          <button
            onClick={close}
            className="flex-1 py-3 text-[10px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"
          >
            CANCEL
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cnBtn(confirming: boolean): string {
  const base =
    "mt-1 w-full py-2.5 text-[10px] font-black tracking-[0.12em] uppercase disabled:opacity-40 transition-colors flex items-center justify-center gap-2";
  return confirming
    ? `${base} bg-[#E60012] text-white hover:bg-[#ff1f30]`
    : `${base} border border-[#E60012]/50 text-[#FF5C5C] hover:bg-[#E60012]/10`;
}
