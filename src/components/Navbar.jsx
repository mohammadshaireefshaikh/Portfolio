import { useState, useEffect, useRef, useCallback } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  // Refs for liquid-selector geometry (mirrors the vanilla-JS version)
  const navContainerRef = useRef(null);
  const linkRefs = useRef([]);
  const selectorRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── updateSelector(): slide + stretch the liquid pill to an element ──
  const updateSelector = useCallback((element, isHover = false) => {
    const container = navContainerRef.current;
    const selector = selectorRef.current;
    if (!element || !container || !selector) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const left = elementRect.left - containerRect.left;
    const width = elementRect.width;

    selector.style.left = `${left}px`;
    selector.style.width = `${width}px`;
    selector.style.top = "50%";
    selector.style.transform = "translateY(-50%)";
    selector.classList.add("active");

    if (isHover) {
      selector.style.boxShadow =
        "inset 0 1px 1px rgba(255,255,255,0.3), 0 0 20px rgba(255, 255, 255, 0.1)";
      selector.style.background =
        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)";
    } else {
      selector.style.boxShadow =
        "inset 0 1px 1px rgba(255,255,255,0.2), 0 0 15px rgba(255, 255, 255, 0.1)";
      selector.style.background =
        "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)";
    }
  }, []);

  // Initialize selector position (100ms delay so layout settles) + resize handler
  useEffect(() => {
    const t = setTimeout(() => updateSelector(linkRefs.current[activeIndex]), 100);
    const onResize = () => updateSelector(linkRefs.current[activeIndex]);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [activeIndex, updateSelector]);

  const handleEnter = (index) => {
    updateSelector(linkRefs.current[index], true);
  };

  const handleLeave = () => {
    updateSelector(linkRefs.current[activeIndex], false);
  };

  const handleClick = (index, href) => {
    setActiveIndex(index);
    const el = linkRefs.current[index];
    updateSelector(el, false);

    // "Boing" spring on click
    const selector = selectorRef.current;
    if (selector) {
      selector.style.transform = "translateY(-50%) scaleX(1.1)";
      setTimeout(() => {
        selector.style.transform = "translateY(-50%) scaleX(1)";
      }, 150);
    }

    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMobileNav = (index, href) => {
    setActiveIndex(index);
    setOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }, 10);
  };

  const glassClass = `liquid-glass ${scrolled ? "liquid-glass-scrolled" : ""}`;

  return (
    <>
      <motion.header
        initial={{ y: reduceMotion ? 0 : -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl"
      >
        {/* ── Desktop liquid pill ─────────────────────────── */}
        <div
          className={`${glassClass} hidden md:flex items-center justify-between gap-2 h-16 pl-6 pr-2 rounded-full`}
        >
          <span
            className="relative z-[1] text-white font-bold text-lg tracking-tighter cursor-pointer group"
            onClick={() => {
              setActiveIndex(0);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {personal.name.split(" ")[0]}
            <span
              className="transition-colors duration-300"
              style={{ color: "#adc6ff" }}
            >
              .
            </span>
          </span>

          {/* nav-container — holds the absolute liquid selector + links */}
          <div
            ref={navContainerRef}
            className="relative flex items-center"
            onMouseLeave={handleLeave}
          >
            <div ref={selectorRef} className="liquid-selector" />
            {links.map((l, i) => (
              <button
                key={l.href}
                ref={(el) => (linkRefs.current[i] = el)}
                data-index={i}
                onClick={() => handleClick(i, l.href)}
                onMouseEnter={() => handleEnter(i)}
                className={`nav-link font-medium px-5 py-2 text-sm transition-colors duration-300 cursor-pointer ${
                  activeIndex === i ? "text-white" : "text-[#c4c7c8] hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <a
            href={personal.cvUrl}
            download
            className="liquid-glass-btn relative z-[1] text-xs font-medium text-white border border-white/10 rounded-full px-6 py-2.5 uppercase tracking-widest flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            CV
          </a>
        </div>

        {/* ── Mobile pill ─────────────────────────────────── */}
        <div
          className={`${glassClass} flex md:hidden items-center justify-between h-14 pl-5 pr-3 rounded-full`}
        >
          <span
            className="relative z-[1] text-white font-bold text-base tracking-tighter cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {personal.name.split(" ")[0]}
            <span style={{ color: "#adc6ff" }}>.</span>
          </span>
          <button
            className="relative z-[1] text-white/90 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* ── Mobile dropdown menu (same glass aesthetic) ───── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm md:hidden"
          >
            <div className="liquid-glass rounded-3xl p-3 flex flex-col gap-1">
              {links.map((l, i) => (
                <button
                  key={l.href}
                  onClick={() => handleMobileNav(i, l.href)}
                  className={`relative z-[1] text-left text-base font-medium px-4 py-3 rounded-2xl transition-colors ${
                    activeIndex === i
                      ? "text-white bg-white/[0.08]"
                      : "text-[#c4c7c8] hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <a
                href={personal.cvUrl}
                download
                className="liquid-glass-btn relative z-[1] mt-1 text-center text-xs font-medium text-white border border-white/10 rounded-2xl px-4 py-3 uppercase tracking-widest"
              >
                Download CV
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
