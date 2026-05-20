"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnded() {
    setFading(true);
    setTimeout(() => setVisible(false), 600);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black select-none"
          animate={{ opacity: fading ? 0 : 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            src="/loading.mp4"
            autoPlay
            playsInline
            onEnded={handleEnded}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
