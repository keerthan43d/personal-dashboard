"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShaderBackground } from "@/components/ui/animated-shader-hero";

const DURATION_MS = 2500;

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const canvasRef = useShaderBackground();
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / DURATION_MS, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setVisible(false), 250);
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
          className="fixed inset-0 z-[9999] overflow-hidden select-none pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Solid black base */}
          <div className="absolute inset-0 bg-[#050505]" />

          {/* WebGL shader canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ opacity: 0.7, mixBlendMode: "screen" }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpeg"
                alt="Command Chamber"
                className="w-28 h-28 sm:w-36 sm:h-36 object-cover"
                style={{ filter: "drop-shadow(0 0 30px rgba(255,214,0,0.3))" }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="text-center"
            >
              <h1
                className="text-white uppercase leading-none"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                }}
              >
                Command
              </h1>
              <h1
                className="text-white uppercase leading-none"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                }}
              >
                Chamber
              </h1>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
              className="w-20 h-px bg-white/25 mt-5 mb-4 origin-center"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-white/35 uppercase mb-10"
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.55rem",
                letterSpacing: "0.45em",
              }}
            >
              Your personal command center
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              className="w-48"
            >
              <div className="h-px bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/55"
                  style={{ width: `${progress * 100}%`, transition: "width 60ms linear" }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span
                  className="text-white/20 uppercase"
                  style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", letterSpacing: "0.3em" }}
                >
                  Loading
                </span>
                <span
                  className="text-white/20"
                  style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem" }}
                >
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
