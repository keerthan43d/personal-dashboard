"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [phase, setPhase] = useState<"enter" | "video" | "done">("enter");
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function dismiss() {
    setFadingOut(true);
    setTimeout(() => setPhase("done"), 600);
  }

  function handleEnter() {
    setPhase("video");
    setTimeout(() => {
      videoRef.current?.play().catch(() => dismiss());
    }, 50);
  }

  // Fallback timeout — if video stalls, dismiss after 20s
  useEffect(() => {
    if (phase !== "video") return;
    const t = setTimeout(dismiss, 20000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black select-none"
        animate={{ opacity: fadingOut ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Video — always mounted so it's ready, but hidden until phase=video */}
        <video
          ref={videoRef}
          src="/loading.mp4"
          playsInline
          onEnded={dismiss}
          onError={dismiss}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: phase === "video" ? "block" : "none" }}
        />

        {/* Click-to-enter overlay */}
        {phase === "enter" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleEnter}
          >
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="Command Chamber"
              className="w-32 h-32 object-cover mb-8"
              style={{ filter: "drop-shadow(0 0 40px rgba(255,214,0,0.4))" }}
            />

            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="border border-[#FFD600]/50 w-40 h-12 flex items-center justify-center"
            >
              <span
                className="text-[#FFD600] uppercase tracking-[0.3em] text-[10px] font-black"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                Enter
              </span>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
