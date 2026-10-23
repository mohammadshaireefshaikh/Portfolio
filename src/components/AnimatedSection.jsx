import { motion } from "framer-motion";

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.03 },
  },
};

// One motion recipe for the whole site: short rise + fade on the project
// curve. Opacity/transform only (compositor-friendly) — the previous
// x + skewX keyframes re-rasterised text every frame and read as flicker.
// MotionConfig in App disables positional motion when the user requests it.
export const EASE = [0.22, 1, 0.36, 1];
export const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay },
  }),
};

// Reveal as soon as a slice of the element is on screen (no negative margin:
// that left sections invisible until well past the fold, so they popped).
export const VIEWPORT = { once: true, amount: 0.12 };

export default function AnimatedSection({ children, className = "", id }) {
  return (
    <motion.div
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}
