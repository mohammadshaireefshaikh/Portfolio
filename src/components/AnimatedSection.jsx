import { motion } from "framer-motion";

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

// A fast side entrance, a short overshoot, then a firm stop (520 ms).
// MotionConfig in App disables positional motion when the user requests it.
export const itemVariants = {
  hidden: { opacity: 0, x: -64, skewX: -5 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: [-64, 8, 0],
    skewX: [-5, 1, 0],
    transition: { duration: 0.52, times: [0, 0.78, 1], ease: "easeOut", delay },
  }),
};

export default function AnimatedSection({ children, className = "", id }) {
  return (
    <motion.div
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
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
