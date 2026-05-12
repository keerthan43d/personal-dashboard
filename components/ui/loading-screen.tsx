"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DURATION_MS = 1800;

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / DURATION_MS, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), 200);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "linear" }}
        >
          {/* Constructivist square mark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="w-10 h-10 border border-[#FFD600] flex items-center justify-center mb-6"
          >
            <div className="w-4 h-4 bg-[#FFD600]" />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1, ease: "linear" }}
            className="text-center mb-8"
          >
            <span className="text-[13px] font-black tracking-[0.22em] uppercase text-white">
              COMMAND
            </span>
            <span className="text-[13px] font-black tracking-[0.22em] uppercase text-[#FFD600] ml-2">
              CHAMBER
            </span>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2, ease: "linear" }}
            className="w-40"
          >
            <div className="h-px bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#FFD600]"
                style={{ width: `${progress * 100}%`, transition: "width 50ms linear" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-white/25">
                Loading
              </span>
              <span className="font-mono text-[9px] text-white/25">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
