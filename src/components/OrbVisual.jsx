import { motion, useReducedMotion } from "framer-motion";
import { stats } from "../data/portfolio";

const RING_CONFIGS = [
  { size: 200, duration: 10, dir: 1,  opacity: 0.25 },
  { size: 300, duration: 18, dir: -1, opacity: 0.15 },
  { size: 410, duration: 28, dir: 1,  opacity: 0.10 },
];

const FLOAT_PANELS = [
  { stat: stats[0], position: { top: "8%",  left: "-5%" },  animDelay: 0 },
  { stat: stats[1], position: { top: "8%",  right: "-5%" }, animDelay: 1 },
  { stat: stats[2], position: { bottom: "18%", left: "-8%" }, animDelay: 0.6 },
  { stat: stats[3], position: { bottom: "18%", right: "-6%" }, animDelay: 1.4 },
];

export default function OrbVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-[420px] h-[420px] flex items-center justify-center shrink-0 select-none">
      {RING_CONFIGS.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: ring.size,
            height: ring.size,
            border: `1px dashed rgba(255,255,255,${ring.opacity})`,
          }}
          animate={reduceMotion ? {} : { rotate: ring.dir === 1 ? 360 : -360 }}
          transition={reduceMotion ? {} : { duration: ring.duration, ease: "linear", repeat: Infinity }}
        >
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0071e3]"
            style={{ boxShadow: "0 0 8px rgba(0,113,227,0.8)" }}
          />
        </motion.div>
      ))}

      <motion.div
        className="absolute w-28 h-28 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(0,113,227,0.35) 0%, transparent 70%)",
        }}
        animate={reduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={reduceMotion ? {} : { duration: 4, ease: "easeInOut", repeat: Infinity }}
      />

      <div
        className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 35% 35%, rgba(41,151,255,0.6), rgba(0,113,227,0.3))",
          border: "1px solid rgba(0,113,227,0.4)",
          boxShadow: "0 0 40px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <span className="text-white text-xl font-bold tracking-tight">MS</span>
      </div>

      {FLOAT_PANELS.map(({ stat, position, animDelay }, i) => (
        <motion.div
          key={i}
          className="absolute px-3 py-2 rounded-xl text-center"
          style={{
            ...position,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            minWidth: 88,
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 + animDelay, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            animate={reduceMotion ? {} : { y: [0, -6, 0] }}
            transition={reduceMotion ? {} : { duration: 3.5 + i * 0.4, ease: "easeInOut", repeat: Infinity, delay: animDelay }}
          >
            <p className="text-sm font-bold text-white tabular-nums">{stat.value}</p>
            <p className="text-[10px] text-[#555] mt-0.5 leading-tight">{stat.label}</p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
