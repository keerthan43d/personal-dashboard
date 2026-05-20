"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function dismiss() {
    setFading(true);
    setTimeout(() => setVisible(false), 600);
  }

  // Fallback: if video takes too long or errors, dismiss after 15s
  useEffect(() => {
    const fallback = setTimeout(dismiss, 15000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black select-none cursor-pointer"
          animate={{ opacity: fading ? 0 : 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={dismiss}
        >
          <video
            ref={videoRef}
            src="/loading.mp4"
            autoPlay
            playsInline
            onEnded={dismiss}
            onError={dismiss}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
