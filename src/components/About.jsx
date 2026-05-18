import { motion } from "framer-motion";
import { MapPin, Trophy } from "lucide-react";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import { personal, awards, stats } from "../data/portfolio";

export default function About() {
  return (
    <section id="about" className="py-28 px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="mb-16">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              About
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight max-w-2xl mb-6">
              Engineer who builds across the stack.
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="text-lg text-[#6e6e73] leading-relaxed max-w-2xl mb-4">
              {personal.bio}
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <div className="flex items-center gap-2 text-sm text-[#444]">
              <MapPin size={13} />
              <span>{personal.location}</span>
            </div>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
            {stats.map((s) => (
              <AnimatedItem key={s.label}>
                <motion.div
                  className="p-5 rounded-2xl text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  whileHover={{ borderColor: "rgba(0,113,227,0.25)", scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xl font-bold text-white tabular-nums tracking-tight mb-1">
                    {s.value}
                  </p>
                  <p className="text-xs text-[#555] leading-tight">{s.label}</p>
                </motion.div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#555] mb-5">
              Recognition
            </p>
          </AnimatedItem>
          <div className="flex flex-col gap-3">
            {awards.map((award, i) => (
              <AnimatedItem key={award.title}>
                <motion.div
                  className="flex items-start gap-5 p-5 rounded-2xl shimmer"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg, rgba(0,113,227,0.08) 0%, rgba(255,255,255,0.02) 100%)"
                        : "rgba(255,255,255,0.02)",
                    border:
                      i === 0
                        ? "1px solid rgba(0,113,227,0.2)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: i === 0 ? "rgba(0,113,227,0.15)" : "rgba(255,255,255,0.05)",
                      border: i === 0 ? "1px solid rgba(0,113,227,0.3)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <Trophy size={14} style={{ color: i === 0 ? "#2997ff" : "#555" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{award.title}</p>
                      <span className="text-[10px] text-[#444]">{award.year}</span>
                    </div>
                    <p className="text-xs text-[#0071e3] mb-1.5">{award.subtitle}</p>
                    <p className="text-xs text-[#555] leading-relaxed">{award.detail}</p>
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
