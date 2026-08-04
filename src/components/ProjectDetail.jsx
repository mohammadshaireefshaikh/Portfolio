import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ExternalLink, ArrowUpRight } from "lucide-react";
import { GitHubIcon } from "./Icons";

const imgSrc = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function ProjectDetail({ project, onClose }) {
  const reduceMotion = useReducedMotion();

  const handleEsc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Lock body scroll + esc-to-close while open
  useEffect(() => {
    if (!project) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [project, handleEsc]);

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            key="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            onClick={onClose}
          />

          {/* Sheet — slides up + fades in */}
          <motion.div
            key="detail-sheet"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[61] overflow-y-auto flex items-start justify-center py-8 px-4 sm:px-6"
            onClick={onClose}
          >
            <div
              className="w-full max-w-3xl relative rounded-3xl overflow-hidden"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full text-[#86868b] hover:text-white transition-colors duration-200 active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* Image header — only if project has image */}
              {project.image && (
                <div className="relative w-full h-64 sm:h-80 overflow-hidden">
                  <img
                    src={imgSrc(project.image)}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 40%, #0a0a0a 100%)",
                    }}
                  />
                </div>
              )}

              {/* Body */}
              <div className="px-6 sm:px-10 pt-8 pb-10">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-xs text-[#555]">{project.year}</span>
                  {project.impact && (
                    <>
                      <span className="w-px h-3 bg-white/[0.12]" />
                      <span className="text-xs font-medium text-[#2997ff]">
                        {project.impact}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-[1.15] mb-6">
                  {project.title}
                </h2>

                {/* Tech chips */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 text-xs font-medium text-[#86868b] rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Long description */}
                <div className="space-y-4 mb-8">
                  {(project.longDescription ?? [project.description]).map(
                    (para, i) => (
                      <p
                        key={i}
                        className="text-[15px] sm:text-base leading-relaxed text-[#c4c7c8]"
                      >
                        {para}
                      </p>
                    )
                  )}
                </div>

                {/* Highlights list */}
                {project.highlights && project.highlights.length > 0 && (
                  <div className="mb-10">
                    <p className="text-xs font-medium text-[#0071e3] tracking-[0.15em] uppercase mb-4">
                      Highlights
                    </p>
                    <ul className="space-y-3">
                      {project.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-[#c4c7c8] leading-relaxed"
                        >
                          <span
                            className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "#0071e3" }}
                          />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTAs */}
                {(project.github || project.demo) && (
                  <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/[0.06]">
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] transition-[background-color,transform] duration-200 px-5 py-2.5 rounded-full"
                      >
                        <ExternalLink size={14} />
                        {project.demoLabel ?? "Live Demo"}
                        <ArrowUpRight size={14} className="opacity-70" />
                      </a>
                    )}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#c4c7c8] hover:text-white active:scale-[0.98] transition-[color,transform] duration-200 px-5 py-2.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.09)",
                        }}
                      >
                        <GitHubIcon size={14} />
                        View Code
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
