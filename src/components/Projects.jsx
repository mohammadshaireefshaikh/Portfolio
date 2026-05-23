import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "./Icons";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import { projects } from "../data/portfolio";

// Prepend Vite base URL so images resolve correctly under /Portfolio/ subpath
const imgSrc = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
      <div
        className="overflow-hidden rounded-3xl"
        style={{
          background: "#111111",
          border: "1px solid rgba(0,113,227,0.2)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex-1 p-8 md:p-12">
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
                  <ExternalLink size={14} /> {project.demoLabel ?? "Live Demo"}
                </a>
              )}
            </div>
          </div>

          {project.image && (
            <div className="md:w-72 shrink-0">
              <img
                src={imgSrc(project.image)}
                alt={project.title}
                className="w-full h-56 md:h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
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
      className="h-full"
    >
      <div
        className="h-full overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {project.image && (
          <img
            src={imgSrc(project.image)}
            alt={project.title}
            className="w-full h-36 object-cover shrink-0"
          />
        )}
        <div className="flex flex-col flex-1 p-6">
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
      </div>
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
