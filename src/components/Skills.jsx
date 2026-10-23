import { motion } from "framer-motion";
import AnimatedSection, { AnimatedItem, itemVariants, VIEWPORT } from "./AnimatedSection";
import { skills } from "../data/portfolio";

function SkillGroup({ category, items, groupIndex }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={groupIndex * 0.08}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="flex flex-col gap-4"
    >
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#86868b]">
        {category}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="px-3 py-1.5 text-sm text-[#9a9aa1] rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="py-16 sm:py-28 px-5 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="mb-16">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              Skills
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              Tools of the trade.
            </h2>
          </AnimatedItem>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {skills.map((group, i) => (
            <SkillGroup key={group.category} {...group} groupIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
