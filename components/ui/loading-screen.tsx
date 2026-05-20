"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function dismiss() {
    setFadingOut(true);
    setTimeout(() => setVisible(false), 600);
  }

  // Fallback — dismiss after 20s if video stalls
  useEffect(() => {
    const t = setTimeout(dismiss, 20000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black select-none cursor-pointer"
          animate={{ opacity: fadingOut ? 0 : 1 }}
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
