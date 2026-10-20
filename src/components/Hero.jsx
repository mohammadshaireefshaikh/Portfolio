import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./Icons";
import GlassButton from "./GlassButton";
import HeroChatCTA from "./HeroChatCTA";
import { personal } from "../data/portfolio";

// Lazy-load Three.js scene so first paint isn't blocked by ~400KB of 3D code
const ConsoleScene = lazy(() => import("./ConsoleScene"));

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const scrollTo = (id) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen px-6 pt-20 pb-10 overflow-hidden">
      <div className="relative z-10 min-h-[calc(100vh-80px)] max-w-6xl mx-auto w-full flex flex-col md:items-start items-center">
        {/* 3D scene — top of left column (desktop), centred on mobile */}
        <div className="w-full md:w-[min(560px,55%)] h-[48vh] md:h-[55vh] shrink-0">
          <Suspense fallback={<div className="w-full h-full" />}>
            <ConsoleScene />
          </Suspense>
        </div>

        {/* Text block — bottom-left on desktop, centred on mobile */}
        <motion.div
          className="w-full md:max-w-xl md:text-left text-center mt-auto pt-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-5">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] uppercase px-3 py-1 rounded-full"
              style={{
                background: "rgba(0,113,227,0.08)",
                border: "1px solid rgba(0,113,227,0.25)",
                color: "#2997ff",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
              Available · Liverpool, UK
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold tracking-[-0.03em] text-white leading-[1.02] mb-3"
          >
            {personal.name}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg font-light tracking-tight mb-4"
            style={{ color: "#86868b" }}
          >
            {personal.title}
            <span style={{ color: "#333" }}> · </span>
            {personal.subtitle}
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-sm leading-relaxed max-w-md mb-6"
            style={{ color: "#6e6e73" }}
          >
            {personal.bio}
          </motion.p>

          <motion.div variants={itemVariants} className="mb-6">
            <HeroChatCTA />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5 mb-6">
            <GlassButton variant="primary" onClick={() => scrollTo("#projects")}>
              View Projects
            </GlassButton>
            <GlassButton variant="glass" onClick={() => scrollTo("#contact")}>
              Contact
            </GlassButton>
            <GlassButton variant="ghost" href={personal.cvUrl} download>
              CV
            </GlassButton>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              <GitHubIcon size={16} />
            </a>
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={16} />
            </a>
            <span className="w-px h-3 bg-white/[0.1]" />
            <a
              href={`mailto:${personal.email}`}
              className="text-[11px] text-[#444] hover:text-[#86868b] transition-colors duration-200"
            >
              {personal.email}
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        onClick={() => scrollTo("#about")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#444] hover:text-[#777] transition-colors cursor-pointer z-20"
        aria-label="Scroll down"
      >
        <ArrowDown size={16} />
      </motion.button>
    </section>
  );
}
