import { motion } from "framer-motion";
import AnimatedSection, { AnimatedItem, itemVariants } from "./AnimatedSection";
import { experience } from "../data/portfolio";

function ExperienceCard({ role, company, period, location, description, highlights, badge, index }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={index * 0.06}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="relative flex gap-3 sm:gap-6"
    >
      <div className="flex flex-col items-center shrink-0 w-4 sm:w-6">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ background: "#0071e3" }}
        />
        {index < experience.length - 1 && (
          <div
            className="flex-1 w-px mt-2"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        )}
      </div>

      <div
        className="min-w-0 flex-1 mb-10 rounded-2xl p-4 sm:p-6 md:p-7"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          transition: "border-color 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,113,227,0.2)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-base font-semibold text-white tracking-tight">{role}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm font-medium text-[#0071e3]">{company}</p>
              {location && (
                <>
                  <span className="text-[#333]">·</span>
                  <p className="text-xs text-[#86868b]">{location}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="text-xs text-[#86868b] font-medium tabular-nums px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {period}
            </span>
            {badge && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,113,227,0.12)",
                  border: "1px solid rgba(0,113,227,0.3)",
                  color: "#2997ff",
                }}
              >
                {badge}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-[#9a9aa1] leading-relaxed mb-5">{description}</p>

        <ul className="flex flex-col gap-2">
          {highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2.5 text-xs text-[#86868b]"
            >
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ background: "rgba(0,113,227,0.7)" }}
              />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function Experience() {
  return (
    <section id="experience" className="py-16 sm:py-28 px-5 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="mb-16">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              Experience
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              What I've shipped.
            </h2>
          </AnimatedItem>
        </AnimatedSection>

        <div className="flex flex-col">
          {experience.map((item, i) => (
            <ExperienceCard key={item.company + item.period} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
