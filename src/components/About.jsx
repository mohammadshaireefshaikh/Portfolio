import { motion } from "framer-motion";
import { MapPin, Trophy } from "lucide-react";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import { personal, awards } from "../data/portfolio";

// Richer metric cards (moved out of Hero's OrbVisual). Horizontal 3-col grid here.
const METRICS = [
  {
    value: "Software Developer",
    label: "AI-assisted development",
    context: "Claude · Cursor · GitHub Copilot",
  },
  {
    value: "1st",
    label: "Google Cloud Hackathon",
    context: "London Summit · 2025",
  },
  {
    value: "+20%",
    label: "Showroom engagement",
    context: "MG · Maruti Suzuki · Jeep",
  },
];

export default function About() {
  return (
    <section id="about" className="py-16 sm:py-28 px-5 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="mb-16">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              About
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight max-w-2xl mb-6">
              I build things end to end.
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="text-lg text-[#9a9aa1] leading-relaxed max-w-2xl mb-4">
              {personal.bio}
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <div className="flex items-center gap-2 text-sm text-[#86868b]">
              <MapPin size={13} />
              <span>{personal.location}</span>
            </div>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
            {METRICS.map((m) => (
              <AnimatedItem key={m.label}>
                <motion.div
                  className="px-5 py-4 rounded-2xl"
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  whileHover={{ borderColor: "rgba(0,113,227,0.25)" }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-2xl font-semibold tracking-tight text-white mb-0.5">
                    {m.value}
                  </p>
                  <p className="text-sm font-medium text-[#f5f5f7]">{m.label}</p>
                  <p className="text-xs text-[#86868b] mt-0.5">{m.context}</p>
                </motion.div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#86868b] mb-5">
              Recognition
            </p>
          </AnimatedItem>
          <div className="flex flex-col gap-3">
            {awards.map((award, i) => (
              <AnimatedItem key={award.title}>
                <motion.div
                  className="flex items-start gap-5 p-5 rounded-2xl"
                  style={{
                    background: i === 0 ? "#111111" : "rgba(255,255,255,0.02)",
                    border:
                      i === 0
                        ? "1px solid rgba(0,113,227,0.2)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: i === 0 ? "rgba(0,113,227,0.15)" : "rgba(255,255,255,0.05)",
                      border: i === 0 ? "1px solid rgba(0,113,227,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <Trophy size={14} style={{ color: i === 0 ? "#2997ff" : "#86868b" }} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{award.title}</p>
                      <span className="text-[10px] text-[#86868b]">{award.year}</span>
                    </div>
                    <p className="text-xs text-[#0071e3] mb-1.5">{award.subtitle}</p>
                    <p className="text-xs text-[#86868b] leading-relaxed">{award.detail}</p>
                  </div>
                </motion.div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
