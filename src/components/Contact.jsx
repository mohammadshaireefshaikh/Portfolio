import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./Icons";
import AnimatedSection, { AnimatedItem, itemVariants } from "./AnimatedSection";
import { personal } from "../data/portfolio";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // No backend: compose the message in the visitor's own mail client.
  // Nothing is stored or sent anywhere except their email provider.
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const subject = encodeURIComponent(`Portfolio enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
    window.location.href = `mailto:${personal.email}?subject=${subject}&body=${body}`;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setLoading(false);
  };

  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

  const inputClass =
    "w-full bg-transparent text-white placeholder-[#86868b] outline-none transition-colors duration-150 ease-out text-base sm:text-sm";
  const promptStyle = { ...mono, color: "#2997ff" };

  return (
    <section id="contact" className="py-16 sm:py-28 px-5 sm:px-6 border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="mb-10">
          <AnimatedItem>
            <p
              className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#86868b] mb-3"
              style={mono}
            >
              [04 / CONTACT]
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-3">
              Let's work together.
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="text-[#9a9aa1] text-base max-w-xl">
              Open to full-time roles, contract work, and interesting projects in the UK.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        {/* Terminal frame — hard offset shadow + sharp border */}
        <motion.div
          variants={itemVariants}
          custom={0.1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
          style={{
            background: "#030304",
            border: "1px solid #2a2a28",
            borderRadius: "6px",
            boxShadow: "6px 6px 0 0 rgba(0,113,227,0.6)",
          }}
        >
          {/* Terminal top bar */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
            style={{ borderColor: "#2a2a28" }}
          >
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
            </div>
            <p className="min-w-0 truncate text-[10px] tracking-[0.08em] sm:tracking-[0.15em] uppercase text-[#86868b]" style={mono}>
              mohammad@portfolio:~ / contact
            </p>
            <span className="hidden w-10 sm:block" />
          </div>

          {/* Terminal body */}
          <div className="px-5 py-6 sm:px-8 sm:py-8" style={mono}>
            {sent ? (
              <div className="flex flex-col gap-1.5 text-sm">
                <p className="text-[#86868b]">$ send message</p>
                <p className="text-[#2997ff]">→ opened in your mail app</p>
                <p className="text-[#ecece8]">Hit send there and I'll be in touch soon.</p>
                <span className="inline-block w-2 h-4 bg-[#2997ff] mt-1 animate-pulse" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="text-[11px] tracking-wider text-[#86868b] mb-1 block">
                    <span style={promptStyle}>$ </span>name:
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="your name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                    style={{ ...mono, borderBottom: "1px dashed #2a2a28", paddingBottom: "6px" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-wider text-[#86868b] mb-1 block">
                    <span style={promptStyle}>$ </span>email:
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    style={{ ...mono, borderBottom: "1px dashed #2a2a28", paddingBottom: "6px" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-wider text-[#86868b] mb-1 block">
                    <span style={promptStyle}>$ </span>message:
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="what are you working on?"
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputClass} resize-none leading-relaxed`}
                    style={{ ...mono, borderBottom: "1px dashed #2a2a28", paddingBottom: "6px" }}
                  />
                </div>

                <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-[#86868b]">
                    <span style={promptStyle}>$ </span>opens your mail app · nothing stored here ·{" "}
                    <a href="/privacy.html" className="underline hover:text-white">privacy</a>
                  </p>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap px-5 py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2997ff] sm:w-auto"
                    style={{
                      ...mono,
                      background: "transparent",
                      border: "1px solid #ecece8",
                      color: "#ecece8",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ecece8";
                      e.currentTarget.style.color = "#030304";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#ecece8";
                    }}
                  >
                    <span>{loading ? "[ sending... ]" : "[ send ]"}</span>
                    {!loading && <Send size={13} className="shrink-0" aria-hidden="true" />}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Signoff row — mono, minimal */}
        <motion.div
          variants={itemVariants}
          custom={0.15}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-white/[0.06]"
          style={mono}
        >
          <a
            href={`mailto:${personal.email}`}
            className="min-w-0 break-all text-xs text-[#86868b] hover:text-white transition-colors duration-200"
          >
            {personal.email}
          </a>
          <div className="flex items-center gap-5">
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#86868b] hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              <GitHubIcon size={16} />
            </a>
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#86868b] hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <LinkedInIcon size={16} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
