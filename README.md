# Mohammad Shaikh — Portfolio v2

Apple-inspired developer portfolio. React + Tailwind CSS v4 + Framer Motion.

## Stack

- React 19 (Vite)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion (parallax, stagger, 3D tilt, blur reveal)
- Lucide React + inline SVG icons

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Edit content

All portfolio data lives in:

```
src/data/portfolio.js
```

Sections:
- `personal` — name, title, bio, email, github, linkedin, cvUrl
- `stats` — 4 numbers shown in hero orb + about section
- `awards` — Google Cloud win + others
- `skills` — 4 grouped categories
- `experience` — TeknTrash, Eccentric, Infogen Labs
- `projects` — featured + regular

## Add CV

Place PDF at `public/cv-mohammad-shaikh.pdf`.

## Contact form

`src/components/Contact.jsx` — replace the `setTimeout` in `handleSubmit` with Formspree or EmailJS:

```js
await fetch("https://formspree.io/f/YOUR_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
```

## Components

| File | Purpose |
|---|---|
| `Navbar.jsx` | Sticky blur nav, mobile menu |
| `Hero.jsx` | Split layout, useScroll parallax, stagger reveal |
| `OrbVisual.jsx` | Orbital rings + floating stat panels |
| `GlassButton.jsx` | Liquid glass button with shimmer |
| `About.jsx` | Stats strip + awards |
| `Skills.jsx` | Grouped tags with stagger |
| `Experience.jsx` | Animated timeline, real companies |
| `Projects.jsx` | Featured cards + 3D cursor tilt |
| `Contact.jsx` | Form + socials |
| `Footer.jsx` | Links + copyright |
| `Icons.jsx` | GitHub + LinkedIn SVG |
| `AnimatedSection.jsx` | Reusable scroll reveal wrapper |
