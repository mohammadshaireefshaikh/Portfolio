import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "./Icons";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import { projects } from "../data/portfolio";

const cardVariants = {
  hidden: { opacity: 0, y: 48, filter: "blur(6px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TiltCard({ children, className = "", style = {} }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(x, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(y, [-0.5, 0.5], ["20%", "80%"]);

  const handleMouseMove = (e) => {
    if (reduceMotion) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
        ...style,
      }}
      className={`relative ${className}`}
    >
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(0,113,227,0.1), transparent 60%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

function FeaturedProjectCard({ project, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="col-span-full"
    >
      <TiltCard>
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,113,227,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(0,113,227,0.2)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,113,227,0.08) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-medium text-[#0071e3] tracking-[0.15em] uppercase">
                  Featured
                </span>
                <span className="w-px h-3 bg-white/[0.15]" />
                <span className="text-xs text-[#555]">{project.year}</span>
                {project.impact && (
                  <>
                    <span className="w-px h-3 bg-white/[0.15]" />
                    <span className="text-xs font-medium text-[#2997ff]">{project.impact}</span>
                  </>
                )}
              </div>

              <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-4">
                {project.title}
              </h3>
              <p className="text-base text-[#6e6e73] leading-relaxed max-w-xl mb-6">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 text-xs font-medium text-[#86868b] rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-[#86868b] hover:text-white transition-colors px-4 py-2 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <GitHubIcon size={14} /> View Code
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-white transition-colors px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed]"
                  >
                    <ExternalLink size={14} /> Live Demo
                  </a>
                )}
              </div>
            </div>

            <div
              className="shrink-0 w-full md:w-56 p-5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#555] mb-4">
                Stack
              </p>
              <ul className="flex flex-col gap-2.5">
                {project.tech.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#0071e3]/60 shrink-0" />
                    <span className="text-xs text-[#86868b]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function SmallProjectCard({ project, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <TiltCard className="h-full">
        <div
          className="relative h-full overflow-hidden rounded-2xl p-6 flex flex-col"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <span className="text-xs text-[#555]">{project.year}</span>
            <div className="flex items-center gap-2">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#444] hover:text-white transition-colors"
                  aria-label={`${project.title} GitHub`}
                >
                  <GitHubIcon size={16} />
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#444] hover:text-white transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white tracking-tight mb-3">
            {project.title}
          </h3>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4 flex-1">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tech.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[11px] font-medium text-[#555] rounded-md"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="py-28 px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="mb-16">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              Projects
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              Selected work.
            </h2>
          </AnimatedItem>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featured.map((p, i) => (
            <FeaturedProjectCard key={p.title} project={p} index={i} />
          ))}
          {rest.map((p, i) => (
            <SmallProjectCard key={p.title} project={p} index={featured.length + i} />
          ))}
        </div>
      </div>
    </section>
  );
}
