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
    // Replace with Formspree / EmailJS / your handler
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  const inputClass =
    "w-full px-4 py-3.5 text-sm text-white placeholder-[#555] rounded-xl outline-none transition-all duration-200";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const inputFocusStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(0,113,227,0.4)",
  };

  return (
    <section id="contact" className="py-28 px-6 border-t border-white/[0.06]">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="mb-16 text-center">
          <AnimatedItem>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#0071e3] mb-4">
              Contact
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Let's work together.
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="text-[#6e6e73] text-lg">
              Open to full-time roles, contract work, and interesting projects in the UK.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="p-8 rounded-3xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <CheckCircle size={40} className="text-[#0071e3]" />
              <p className="text-white font-medium text-lg">Message sent.</p>
              <p className="text-[#6e6e73] text-sm">I'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="What are you working on?"
                value={form.message}
                onChange={handleChange}
                className={`${inputClass} resize-none`}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputStyle)}
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? "Sending…" : <>Send Message <Send size={14} /></>}
              </motion.button>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-8 mt-10"
        >
          <a
            href={`mailto:${personal.email}`}
            className="text-sm text-[#555] hover:text-[#86868b] transition-colors duration-200"
          >
            {personal.email}
          </a>
          <a
            href={personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555] hover:text-white transition-colors duration-200"
            aria-label="GitHub"
          >
            <GitHubIcon size={18} />
          </a>
          <a
            href={personal.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#555] hover:text-white transition-colors duration-200"
            aria-label="LinkedIn"
          >
            <LinkedInIcon size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
