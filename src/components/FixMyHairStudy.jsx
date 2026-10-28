import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import AnimatedSection, { AnimatedItem, EASE } from "./AnimatedSection";
import { InViewVideo } from "./Projects";
import GlassButton from "./GlassButton";
import { fixmyhairStudy as study } from "../data/portfolio";

const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const src = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

/**
 * One client, several directions. A direction switcher (tabs on desktop,
 * horizontal scroller on phones) with a looping clip, a short "what this
 * explores" and one action. Depth with one client reads stronger than five
 * look-alike cards.
 */
export default function FixMyHairStudy() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(study.directions[0].id);
  const active = study.directions.find((d) => d.id === activeId);

  return (
    <section id="fixmyhair" className="py-16 sm:py-28 px-5 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="mb-10">
          <AnimatedItem>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#86868b] mb-3" style={mono}>
              [04 / CASE STUDY]
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              FixMyHair. One client, six directions.
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mt-4 text-sm sm:text-base text-[#9a9aa1] max-w-2xl leading-relaxed">
              {study.summary}
            </p>
          </AnimatedItem>
        </AnimatedSection>

        {/* Direction switcher */}
        <div
          role="tablist"
          aria-label="FixMyHair directions"
          className="-mx-5 px-5 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-2 mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {study.directions.map((d, i) => {
            const on = d.id === activeId;
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={on}
                aria-controls={`fmh-panel-${d.id}`}
                onClick={() => setActiveId(d.id)}
                className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-full text-sm font-medium transition-colors duration-200 border ${
                  on
                    ? "bg-white text-black border-white"
                    : "text-[#c4c7c8] border-white/[0.12] hover:text-white hover:border-white/[0.28]"
                }`}
              >
                <span className="text-[10px] tracking-[0.15em]" style={mono}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* Clip */}
            <div className="relative aspect-video bg-black">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  id={`fmh-panel-${active.id}`}
                  role="tabpanel"
                  className="absolute inset-0"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {!reduceMotion ? (
                    <InViewVideo
                      src={src(active.video)}
                      poster={src(active.poster)}
                      title={`${active.label} — FixMyHair`}
                      threshold={0.1}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={src(active.poster)} alt={`${active.label} — FixMyHair`} className="w-full h-full object-cover" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Copy */}
            <div className="p-6 sm:p-8 flex flex-col">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  className="flex flex-col flex-1"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#2997ff] mb-3" style={mono}>
                    {active.kicker}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug mb-3">
                    {active.title}
                  </h3>
                  <p className="text-sm text-[#9a9aa1] leading-relaxed mb-5">{active.blurb}</p>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {active.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[11px] text-[#9a9aa1] rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    {active.cta ? (
                      <GlassButton
                        variant="primary"
                        href={active.cta.internal ? src(active.cta.href) : active.cta.href}
                      >
                        {active.cta.label} <ArrowUpRight size={14} />
                      </GlassButton>
                    ) : (
                      <span className="text-[11px] text-[#60605c] tracking-[0.1em] uppercase" style={mono}>
                        Design study · not public
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Receipts */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/[0.06]">
            {study.receipts.map((r, i) => (
              <div
                key={r.v}
                className={`px-6 py-5 ${i % 2 === 1 ? "border-l border-white/[0.06]" : ""} ${
                  i >= 2 ? "border-t md:border-t-0 border-white/[0.06]" : ""
                } ${i >= 1 ? "md:border-l" : ""}`}
              >
                <div className="text-2xl sm:text-3xl font-semibold text-white tabular-nums tracking-tight">{r.k}</div>
                <div className="text-[11px] text-[#86868b] mt-1 tracking-[0.05em]" style={mono}>
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-[#60605c]" style={mono}>
          Unreleased directions shown with the client's permission. Previews are design studies; forms in them send nothing.
        </p>
      </div>
    </section>
  );
}
