import { motion, useReducedMotion } from "framer-motion";

const METRICS = [
  {
    value: "Vibe Coder",
    label: "AI-assisted development",
    context: "Claude · Cursor · GitHub Copilot",
  },
  {
    value: "1st",
    label: "Google Cloud Hackathon",
    context: "London Summit · 2025",
  },
  {
    value: "+20%",
    label: "Showroom engagement",
    context: "MG · Maruti Suzuki · Jeep",
  },
];

export default function OrbVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-3 w-72 shrink-0 select-none">
      {METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.6,
            delay: reduceMotion ? 0 : 0.8 + i * 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="px-5 py-4 rounded-2xl"
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            className="text-2xl font-semibold tracking-tight text-white mb-0.5"
          >
            {m.value}
          </p>
          <p className="text-sm font-medium text-[#f5f5f7]">{m.label}</p>
          <p className="text-xs text-[#444] mt-0.5">{m.context}</p>
        </motion.div>
      ))}
    </div>
  );
}
