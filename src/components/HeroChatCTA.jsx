import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HeroChatCTA() {
  const reduceMotion = useReducedMotion();

  const openChat = () => {
    window.dispatchEvent(new CustomEvent("open-chat"));
  };

  return (
    <motion.button
      onClick={openChat}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="group relative inline-flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(0,113,227,0.12) 0%, rgba(0,113,227,0.04) 100%)",
        border: "1px solid rgba(0,113,227,0.35)",
        boxShadow: "0 0 24px rgba(0,113,227,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
      aria-label="Open AI assistant"
    >
      {/* Pulsing sparkle badge */}
      <span className="relative flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
        style={{ background: "#0071e3" }}
      >
        {!reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-xl"
            style={{ background: "#0071e3" }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <Sparkles size={14} className="relative text-white" />
      </span>

      <span className="flex flex-col items-start text-left leading-tight">
        <span className="text-[11px] uppercase tracking-[0.15em] font-medium text-[#2997ff]">
          New · AI Assistant
        </span>
        <span className="text-sm font-medium text-white mt-0.5">
          Ask anything about my work
        </span>
      </span>

      <ArrowRight
        size={16}
        className="text-[#2997ff] transition-transform duration-300 ease-out group-hover:translate-x-1 ml-1"
      />

      {/* Shine sweep on hover */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
        }}
      />
    </motion.button>
  );
}
