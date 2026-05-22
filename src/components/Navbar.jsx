import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { personal } from "../data/portfolio";

const links = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href) => {
    setOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 10);
  };

  return (
    <>
      <motion.header
        initial={{ y: reduceMotion ? 0 : -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-white/[0.05]" : "border-b border-transparent"
        }`}
        style={{
          background: scrolled ? "rgba(0, 0, 0, 0.97)" : "transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <motion.span
            className="text-white font-semibold text-sm tracking-tight cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {personal.name.split(" ")[0]}
            <span style={{ color: "#0071e3" }}>.</span>
          </motion.span>

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l, i) => (
              <motion.button
                key={l.href}
                onClick={() => handleNav(l.href)}
                className="text-[#86868b] hover:text-white text-sm font-medium transition-colors duration-200 cursor-pointer"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              >
                {l.label}
              </motion.button>
            ))}
            <motion.a
              href={personal.cvUrl}
              download
              className="text-sm font-medium px-4 py-1.5 rounded-full text-white transition-colors duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.09)" }}
              whileTap={{ scale: 0.97 }}
            >
              CV
            </motion.a>
          </nav>

          <button
            className="md:hidden text-[#86868b] hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden"
            style={{
              background: "#000",
            }}
          >
            {links.map((l, i) => (
              <motion.button
                key={l.href}
                onClick={() => handleNav(l.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="text-2xl font-medium text-white/80 hover:text-white transition-colors"
              >
                {l.label}
              </motion.button>
            ))}
            <motion.a
              href={personal.cvUrl}
              download
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 text-sm font-medium px-6 py-2.5 rounded-full text-white"
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              Download CV
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
