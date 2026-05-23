import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./Icons";
import GlassButton from "./GlassButton";
import OrbVisual from "./OrbVisual";
import { personal } from "../data/portfolio";

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
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-20 pb-16 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          <motion.div
            className="flex-1 max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <span
                className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase px-4 py-1.5 rounded-full"
                style={{
                  background: "rgba(0,113,227,0.08)",
                  border: "1px solid rgba(0,113,227,0.25)",
                  color: "#2997ff",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <OrbVisual />
          </motion.div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        onClick={() => scrollTo("#about")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#444] hover:text-[#777] transition-colors cursor-pointer"
        aria-label="Scroll down"
      >
        <ArrowDown size={16} />
      </motion.button>
    </section>
  );
}
