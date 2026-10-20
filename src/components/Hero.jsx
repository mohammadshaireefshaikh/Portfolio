import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassButton from "./GlassButton";
import HeroChatCTA from "./HeroChatCTA";
import LoadingOverlay from "./LoadingOverlay";
import { personal } from "../data/portfolio";

// Lazy-load Three.js scene so first paint isn't blocked by ~400KB of 3D code
const ConsoleScene = lazy(() => import("./ConsoleScene"));

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

// Slide-down reveal (ClickFunnels-style progressive reveal)
const itemVariants = {
  hidden: { opacity: 0, y: -24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const [entered, setEntered] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  // Hide the hero text block while the arcade game is in play/dead mode.
  // ConsoleScene broadcasts 'game-mode' when its internal mode state changes.
  useEffect(() => {
    const onMode = (e) => setGameActive(e.detail === "playing" || e.detail === "dead");
    window.addEventListener("game-mode", onMode);
    return () => window.removeEventListener("game-mode", onMode);
  }, []);

  const scrollTo = (id) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* 3D room scene — fills the whole hero as the backdrop */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <ConsoleScene />
        </Suspense>
      </div>

      {/* Loading screen (sits above everything until the user clicks ENTER) */}
      {!entered && <LoadingOverlay onEnter={() => setEntered(true)} />}

      {/* Bottom strip — minimal identity + CTAs. Pinned to the hero's bottom
          edge with a black→transparent fade so it only covers the plinth /
          bottom sliver of the room; the model above stays fully clickable.
          Socials + CV moved to the navbar. Hidden while the game is active. */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          opacity: gameActive ? 0 : 1,
          visibility: gameActive ? "hidden" : "visible",
          transition: "opacity 300ms ease-out, visibility 300ms",
        }}
      >
        {/* fade backdrop */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[150%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        <motion.div
          className="relative pointer-events-auto max-w-6xl mx-auto px-5 sm:px-6 pb-9 sm:pb-8 pt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={entered && !gameActive ? "visible" : "hidden"}
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.7)" }}
        >
          {/* Identity */}
          <div className="min-w-0">
            <motion.div variants={itemVariants} className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#2997ff]">
                Available · Liverpool, UK
              </span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.025em] text-white leading-tight"
            >
              {personal.name}
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-sm font-light tracking-tight mt-0.5"
              style={{ color: "#9aa3b5" }}
            >
              {personal.title}
              <span style={{ color: "#4a4f5a" }}> · </span>
              {personal.subtitle}
            </motion.p>
            <motion.a
              variants={itemVariants}
              href="/flappy.html"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#60605c] hover:text-[#2997ff] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              aria-label="Play Flappy — the game running on the console"
            >
              <span>▸</span>
              <span>THE CABINET RUNS FLAPPY — CLICK IT</span>
            </motion.a>
          </div>

          {/* Actions */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-2.5 md:justify-end shrink-0 pr-[76px] md:pr-0"
          >
            <HeroChatCTA compact />
            <GlassButton variant="primary" onClick={() => scrollTo("#projects")}>
              View Projects
            </GlassButton>
            <GlassButton variant="glass" onClick={() => scrollTo("#contact")}>
              Contact
            </GlassButton>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
