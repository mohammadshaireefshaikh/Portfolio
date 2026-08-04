import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import ProjectDetail from "./ProjectDetail";
import { projects } from "../data/portfolio";

const imgSrc = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

function ProjectCard({ project, index, onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group text-left h-full overflow-hidden rounded-2xl flex flex-col cursor-pointer transition-[border-color,box-shadow] duration-300 ease-out hover:shadow-[0_12px_40px_rgba(0,113,227,0.08)]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      aria-label={`Open details for ${project.title}`}
    >
      {project.image && (
        <div className="w-full h-36 overflow-hidden shrink-0">
          <img
            src={imgSrc(project.image)}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-xs text-[#555]">{project.year}</span>
          <ArrowUpRight
            size={16}
            className="text-[#444] transition-all duration-300 ease-out group-hover:text-[#2997ff] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>

        <h3 className="text-lg font-semibold text-white tracking-tight mb-3">
          {project.title}
        </h3>
        <p className="text-sm text-[#6e6e73] leading-relaxed mb-4 flex-1">
          {project.description}
        </p>

        {project.impact && (
          <p className="text-xs font-medium text-[#2997ff] mb-3">
            {project.impact}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {project.tech.slice(0, 4).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-[11px] font-medium text-[#86868b] rounded-md"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {t}
            </span>
          ))}
          {project.tech.length > 4 && (
            <span className="px-2 py-0.5 text-[11px] font-medium text-[#555]">
              +{project.tech.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function Projects() {
  const [active, setActive] = useState(null);

  return (
    <>
      <section id="projects" className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
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
            <AnimatedItem>
              <p className="mt-4 text-sm text-[#6e6e73] max-w-md">
                Tap any project for the full story.
              </p>
            </AnimatedItem>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id ?? p.title}
                project={p}
                index={i}
                onOpen={() => setActive(p)}
              />
            ))}
          </div>
        </div>
      </section>

      <ProjectDetail project={active} onClose={() => setActive(null)} />
    </>
  );
}
