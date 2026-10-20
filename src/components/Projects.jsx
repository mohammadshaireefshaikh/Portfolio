import { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, LayoutGrid, List as ListIcon } from "lucide-react";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import ProjectDetail from "./ProjectDetail";
import { projects } from "../data/portfolio";

const imgSrc = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

// Pad a 1-based index to a two-digit mono label (01, 02, …)
const pad2 = (n) => String(n + 1).padStart(2, "0");

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Max tilt in degrees. Small by design — depth cue, not toy.
const TILT_MAX = 6;

function ProjectCard({ project, index, onOpen }) {
  const reduceMotion = useReducedMotion();
  const btnRef = useRef(null);

  function applyTransform(rx, ry, lift, dur, ease) {
    const el = btnRef.current;
    if (!el) return;
    el.style.transition = `transform ${dur}ms ${ease}`;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${lift}px)`;
  }

  function handleMove(e) {
    if (reduceMotion) return;
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * 2 * TILT_MAX;
    const rx = (0.5 - py) * 2 * TILT_MAX;
    applyTransform(rx.toFixed(2), ry.toFixed(2), -3, 120, "ease-out");
  }

  function handleLeave() {
    applyTransform(0, 0, 0, 500, "cubic-bezier(0.22, 1, 0.36, 1)");
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="h-full"
    >
    <button
      ref={btnRef}
      type="button"
      onClick={onOpen}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group text-left w-full h-full overflow-hidden rounded-2xl flex flex-col cursor-pointer hover:shadow-[0_18px_50px_rgba(0,113,227,0.12)] active:scale-[0.985]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        transformStyle: "preserve-3d",
        willChange: "transform",
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
          <span
            className="text-[10px] tracking-[0.15em] uppercase text-[#555] group-hover:text-[#2997ff] transition-colors duration-200"
            style={mono}
          >
            {pad2(index)} / {project.tech[0]?.toUpperCase()} · {project.year}
          </span>
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
    </button>
    </motion.div>
  );
}

function ProjectRow({ project, index, onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_auto] items-center gap-4 md:gap-6 w-full text-left px-4 py-4 border-t border-white/[0.06] hover:bg-white/[0.025] transition-colors duration-150"
      style={mono}
      aria-label={`Open details for ${project.title}`}
    >
      <span className="text-[11px] tracking-[0.15em] text-[#555] group-hover:text-[#2997ff] transition-colors duration-150">
        {pad2(index)}
      </span>
      <span className="text-sm text-white truncate font-sans font-medium tracking-tight">
        {project.title}
      </span>
      <span className="hidden md:inline text-[11px] text-[#60605c] truncate tracking-[0.05em]">
        {project.tech.slice(0, 3).join(" · ")}
      </span>
      <span className="flex items-center gap-3 text-[11px] text-[#60605c] tracking-[0.1em]">
        <span>{project.year}</span>
        <ArrowUpRight
          size={14}
          className="text-[#444] group-hover:text-[#2997ff] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200"
        />
      </span>
    </motion.button>
  );
}

export default function Projects() {
  const [active, setActive] = useState(null);
  const [view, setView] = useState("grid"); // 'grid' | 'list'

  return (
    <>
      <section id="projects" className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="mb-10">
            <AnimatedItem>
              <p
                className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#555] mb-3"
                style={mono}
              >
                [03 / PROJECTS]
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

          {/* View toggle */}
          <div className="flex items-center justify-between mb-6">
            <p
              className="text-[10px] tracking-[0.15em] uppercase text-[#60605c]"
              style={mono}
            >
              {projects.length.toString().padStart(2, "0")} ENTRIES
            </p>
            <div
              className="inline-flex p-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <button
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors duration-150 ${
                  view === "grid" ? "text-white bg-white/[0.08]" : "text-[#60605c] hover:text-white"
                }`}
                style={mono}
              >
                <LayoutGrid size={11} /> GRID
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors duration-150 ${
                  view === "list" ? "text-white bg-white/[0.08]" : "text-[#60605c] hover:text-white"
                }`}
                style={mono}
              >
                <ListIcon size={11} /> LIST
              </button>
            </div>
          </div>

          {view === "grid" ? (
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
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Header row */}
              <div
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.5fr)_auto] items-center gap-4 md:gap-6 px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-[#555]"
                style={{ ...mono, background: "rgba(255,255,255,0.02)" }}
              >
                <span>#</span>
                <span>Title</span>
                <span className="hidden md:inline">Stack</span>
                <span>Year</span>
              </div>
              {projects.map((p, i) => (
                <ProjectRow
                  key={p.id ?? p.title}
                  project={p}
                  index={i}
                  onOpen={() => setActive(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ProjectDetail project={active} onClose={() => setActive(null)} />
    </>
  );
}
