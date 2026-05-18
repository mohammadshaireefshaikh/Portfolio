import { personal } from "../data/portfolio";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#555]">© {year} {personal.name}</p>
        <p className="text-xs text-[#444]">
          Built with React · Tailwind CSS · Framer Motion
        </p>
        <div className="flex items-center gap-5">
          <a href={personal.github} target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#86868b] transition-colors">GitHub</a>
          <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-[#86868b] transition-colors">LinkedIn</a>
          <a href={`mailto:${personal.email}`} className="text-xs text-[#555] hover:text-[#86868b] transition-colors">Email</a>
        </div>
      </div>
    </footer>
  );
}
