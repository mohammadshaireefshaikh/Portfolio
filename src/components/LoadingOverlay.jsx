import { useState, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Full-screen loader that watches Three.js asset progress (via drei's
 * useProgress) + font readiness. Dismisses only when the user clicks
 * ENTER THE ROOM — gives us a user gesture to prime audio, and a nice
 * "press start" beat before the scene reveals.
 */
export default function LoadingOverlay({ onEnter }) {
  const { progress, active, total } = useProgress();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  // Ready when Three.js loaders finish (or when nothing was ever queued —
  // a procedural scene with no HDRI/textures reports total=0 forever) and
  // fonts are in. Hard 7s fallback so the gate can never deadlock.
  useEffect(() => {
    const settled = !active && (progress >= 100 || total === 0);
    if (!settled) return;
    const t = setTimeout(async () => {
      try { await document.fonts.ready; } catch {}
      setReady(true);
    }, 350);
    return () => clearTimeout(t);
  }, [progress, active, total]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 7000);
    return () => clearTimeout(t);
  }, []);

  function enter() {
    // ConsoleScene listens: rumble + quake + rock-slab reveal start now,
    // under the overlay fade, so the room is already moving when it clears.
    window.dispatchEvent(new CustomEvent("room-enter"));
    setVisible(false);
    // Hero text follows once the lower slabs have cleared the plinth.
    setTimeout(() => onEnter?.(), 1500);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white px-6"
          style={{
            background: "radial-gradient(ellipse at center, #0a0d14 0%, #000 70%)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {/* Monogram / brand */}
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#60605c] mb-4">
            MOHAMMAD SHAIKH
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-center max-w-md"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {ready ? "Step into the room." : "Loading the room…"}
          </h1>

          {/* Progress bar */}
          <div className="mt-10 w-full max-w-[280px]">
            <div
              className="h-[2px] w-full rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                className="h-full"
                style={{ background: "#0071e3", boxShadow: "0 0 12px rgba(0,113,227,0.5)" }}
                initial={{ width: 0 }}
                animate={{ width: `${ready ? 100 : Math.min(100, Math.max(0, progress))}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] tracking-[0.2em] uppercase text-[#60605c]">
              <span>
                {ready ? "READY" : "LOADING"}
              </span>
              <span className="tabular-nums text-[#2997ff]">
                {Math.round(ready ? 100 : progress)}%
              </span>
            </div>
          </div>

          {/* Enter button — only appears when ready */}
          <AnimatePresence>
            {ready && (
              <motion.button
                key="enter"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                onClick={enter}
                className="mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-full text-xs tracking-[0.2em] uppercase text-white transition-colors duration-200 hover:bg-[#0077ed] active:scale-[0.98]"
                style={{ background: "#0071e3", boxShadow: "0 8px 32px rgba(0,113,227,0.35)" }}
              >
                <span>▶</span>
                Enter the Room
              </motion.button>
            )}
          </AnimatePresence>

          {/* Idle hint */}
          <p className="mt-6 text-[10px] tracking-[0.2em] uppercase text-[#444]">
            {ready ? "Audio starts on click" : "Preparing scene & fonts"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
