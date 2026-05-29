"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProductivity } from "@/lib/hooks/use-productivity";
import type { UrgeLogInput } from "@/lib/db/schemas";

interface Props {
  entryDate: string;
}

export function UrgeLogSection({ entryDate }: Props) {
  const { urgeLogs, loadUrgeLogs, addUrge, removeUrge } = useProductivity();
  const [urgeText, setUrgeText] = useState("");
  const [avoidingText, setAvoidingText] = useState("");
  const [showAvoiding, setShowAvoiding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUrgeLogs(entryDate);
  }, [entryDate, loadUrgeLogs]);

  async function handleAdd() {
    const trimmed = urgeText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const data: UrgeLogInput = {
        entryDate,
        urge: trimmed,
        avoiding: avoidingText.trim() || undefined,
        loggedAt: new Date().toISOString(),
      };
      await addUrge(data);
      setUrgeText("");
      setAvoidingText("");
      setShowAvoiding(false);
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  const todayCount = urgeLogs.filter((u) => u.entryDate === entryDate).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#FF3366]" />
          <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
            Urge Log
          </span>
        </div>
        {todayCount > 0 && (
          <span className="text-[10px] font-black tracking-[0.08em] text-[#FF3366]">
            {todayCount} caught today
          </span>
        )}
      </div>

      {/* Quick-add form */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={urgeText}
            onChange={(e) => setUrgeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="I wanted to..."
            className={cn(
              "flex-1 h-8 bg-transparent border border-white/15 px-3",
              "text-sm text-white placeholder:text-white/20 outline-none",
              "focus:border-[#FF3366]/40 transition-colors"
            )}
          />
          <button
            onClick={handleAdd}
            disabled={!urgeText.trim() || submitting}
            className={cn(
              "h-8 w-8 flex items-center justify-center border border-[#FF3366]/40",
              "text-[#FF3366] hover:bg-[#FF3366]/10 transition-colors",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {!showAvoiding ? (
          <button
            onClick={() => setShowAvoiding(true)}
            className="text-[9px] font-black tracking-[0.08em] uppercase text-white/50 hover:text-white/50 transition-colors"
          >
            what were you avoiding?
          </button>
        ) : (
          <input
            value={avoidingText}
            onChange={(e) => setAvoidingText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instead of..."
            className={cn(
              "w-full h-7 bg-transparent border border-white/10 px-3",
              "text-xs text-white/70 placeholder:text-white/20 outline-none",
              "focus:border-[#FF3366]/30 transition-colors"
            )}
          />
        )}
      </div>

      {/* Urge list */}
      <div className="space-y-0">
        <AnimatePresence initial={false}>
          {urgeLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="group flex items-start gap-3 py-2 px-2 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-mono text-white/50 pt-0.5 shrink-0">
                  {formatTime(log.loggedAt)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{log.urge}</p>
                  {log.avoiding && (
                    <p className="text-xs text-white/55 mt-0.5">
                      avoiding: {log.avoiding}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeUrge(log.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-[#FF3366] shrink-0 pt-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {urgeLogs.length === 0 && (
          <p className="text-xs text-white/45 italic py-2">No urges logged today.</p>
        )}
      </div>
    </div>
  );
}
