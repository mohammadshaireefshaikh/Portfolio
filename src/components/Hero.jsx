import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowDown } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./Icons";
import GlassButton from "./GlassButton";
import OrbVisual from "./OrbVisual";
import { personal } from "../data/portfolio";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.13, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 36, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.88, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const textY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -80]);
  const textOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const orbY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 60]);
  const orbOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const bgY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 120]);

  const scrollTo = (id) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-20 pb-16 overflow-hidden">
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,113,227,0.08) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,113,227,0.4), transparent)",
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          <motion.div
            className="flex-1 max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ y: textY, opacity: textOpacity }}
          >
            <motion.div variants={badgeVariants} className="mb-8">
              <span
                className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(0,113,227,0.08)",
                  border: "1px solid rgba(0,113,227,0.25)",
                  color: "#2997ff",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#2997ff]"
                  style={{ boxShadow: "0 0 6px rgba(41,151,255,0.8)" }}
                />
                Available for opportunities · Liverpool, UK
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-[clamp(3rem,8vw,5.5rem)] font-semibold tracking-[-0.03em] text-white leading-[1.0] mb-5"
            >
              {personal.name}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl font-light tracking-tight mb-5"
              style={{ color: "#86868b" }}
            >
              {personal.title}
              <span style={{ color: "#333" }}> · </span>
              {personal.subtitle}
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg leading-relaxed max-w-lg mb-10"
              style={{ color: "#6e6e73" }}
            >
              {personal.bio}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
              <GlassButton variant="primary" onClick={() => scrollTo("#projects")}>
                View Projects
              </GlassButton>
              <GlassButton variant="glass" onClick={() => scrollTo("#contact")}>
                Contact Me
              </GlassButton>
              <GlassButton variant="ghost" href={personal.cvUrl} download>
                Download CV
              </GlassButton>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-5">
              <a
                href={personal.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#555] hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <GitHubIcon size={18} />
              </a>
              <a
                href={personal.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#555] hover:text-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <LinkedInIcon size={18} />
              </a>
              <span className="w-px h-4 bg-white/[0.1]" />
              <a
                href={`mailto:${personal.email}`}
                className="text-xs text-[#444] hover:text-[#86868b] transition-colors duration-200"
              >
                {personal.email}
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: orbY, opacity: orbOpacity }}
          >
            <OrbVisual />
          </motion.div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        onClick={() => scrollTo("#about")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#444] hover:text-[#777] transition-colors cursor-pointer"
        aria-label="Scroll down"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.button>
    </section>
  );
}
