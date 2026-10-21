import { personal } from "../data/portfolio";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#86868b]">© {year} {personal.name}</p>
        <p className="text-xs text-[#86868b]">
          Built with React · Tailwind CSS · Framer Motion ·{" "}
          <a href="https://sketchfab.com/3d-models/electrocoin-goliath-mk3-f97fc21404684e3ab1eb7665e20c5d3e" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
            Cabinet model by Delinx (CC-BY 4.0)
          </a>
        </p>
        <div className="flex items-center gap-5">
          <a href={personal.github} target="_blank" rel="noopener noreferrer" className="text-xs text-[#86868b] hover:text-[#86868b] transition-colors">GitHub</a>
          <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-[#86868b] hover:text-[#86868b] transition-colors">LinkedIn</a>
          <a href={`mailto:${personal.email}`} className="text-xs text-[#86868b] hover:text-[#86868b] transition-colors">Email</a>
          <a href="/privacy.html" className="text-xs text-[#86868b] hover:text-[#86868b] transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
