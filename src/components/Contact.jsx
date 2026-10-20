import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./Icons";
import AnimatedSection, { AnimatedItem } from "./AnimatedSection";
import { personal } from "../data/portfolio";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } else {
      alert("Something went wrong. Please try again.");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

  const inputClass =
    "w-full bg-transparent text-white placeholder-[#555] outline-none transition-colors duration-150 ease-out text-sm";
  const promptStyle = { ...mono, color: "#2997ff" };

  return (
    <section id="contact" className="py-28 px-6 border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="mb-10">
          <AnimatedItem>
            <p
              className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#555] mb-3"
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
            <p className="text-[#6e6e73] text-base max-w-xl">
              Open to full-time roles, contract work, and interesting projects in the UK.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        {/* Terminal frame — hard offset shadow + sharp border */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
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
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: "#2a2a28" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a38" }} />
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#60605c]" style={mono}>
              mohammad@portfolio:~ / contact
            </p>
            <span className="w-10" />
          </div>

          {/* Terminal body */}
          <div className="px-5 py-6 sm:px-8 sm:py-8" style={mono}>
            {sent ? (
              <div className="flex flex-col gap-1.5 text-sm">
                <p className="text-[#60605c]">$ send message</p>
                <p className="text-[#2997ff]">→ transmitted · 200 OK</p>
                <p className="text-[#ecece8]">I'll be in touch soon.</p>
                <span className="inline-block w-2 h-4 bg-[#2997ff] mt-1 animate-pulse" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="text-[11px] tracking-wider text-[#60605c] mb-1 block">
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
                  <label className="text-[11px] tracking-wider text-[#60605c] mb-1 block">
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
                  <label className="text-[11px] tracking-wider text-[#60605c] mb-1 block">
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

                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-[11px] text-[#60605c]">
                    <span style={promptStyle}>$ </span>Enter to send
                  </p>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white disabled:opacity-40 transition-colors duration-150"
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
                    {loading ? "[ sending... ]" : <>[ send ] <Send size={11} /></>}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Signoff row — mono, minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-white/[0.06]"
          style={mono}
        >
          <a
            href={`mailto:${personal.email}`}
            className="text-xs text-[#86868b] hover:text-white transition-colors duration-200"
          >
            {personal.email}
          </a>
          <div className="flex items-center gap-5">
            <a
              href={personal.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-white transition-colors duration-200"
              aria-label="GitHub"
            >
              <GitHubIcon size={16} />
            </a>
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-white transition-colors duration-200"
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
