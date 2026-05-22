import { motion } from "framer-motion";

export default function GlassButton({
  children,
  onClick,
  href,
  download,
  variant = "glass",
  className = "",
  ...props
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer select-none";

  const variants = {
    primary: "bg-[#0071e3] hover:bg-[#0077ed] text-white border border-transparent",
    glass: "glass-btn text-white hover:bg-white/[0.10]",
    ghost: "bg-transparent border border-white/[0.12] text-[#86868b] hover:text-white hover:border-white/[0.2]",
  };

  const motionProps = {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring", stiffness: 400, damping: 25 },
  };

  const all = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        download={download}
        target={!download ? "_blank" : undefined}
        rel={!download ? "noopener noreferrer" : undefined}
        className={all}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button onClick={onClick} className={all} {...motionProps} {...props}>
      {children}
    </motion.button>
  );
}
