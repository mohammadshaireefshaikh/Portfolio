# Mohammad Shaikh — Portfolio v2

> Apple-inspired developer portfolio built with React, Vite, Tailwind CSS v4, and Framer Motion.

[**Live Portfolio**](https://mohammadshaireefshaikh.github.io/Portfolio/)

---

## Overview

This repository contains the source code for **Mohammad Shaikh’s portfolio website** — a modern, motion-rich personal site designed to showcase projects, experience, skills, awards, and contact information.

The portfolio blends a clean visual system with smooth interactions, including parallax effects, staggered reveals, 3D tilt cards, floating stat panels, and glassmorphism-inspired UI details.

---

## Live Demo

Visit the deployed portfolio here:

**[https://mohammadshaireefshaikh.github.io/Portfolio/](https://mohammadshaireefshaikh.github.io/Portfolio/)**

---

## Tech Stack

- **React 19** — component-driven UI
- **Vite** — fast development server and optimized production builds
- **Tailwind CSS v4** — utility-first styling with `@tailwindcss/vite`
- **Framer Motion** — animation system for reveal effects, parallax, and transitions
- **Lucide React** — clean iconography
- **Inline SVG** — custom brand and social visuals

---

## Highlights

- Apple-inspired visual direction
- Smooth motion and scroll-based interactions
- Fully responsive layout
- Reusable animated sections
- Project cards with interactive 3D tilt
- Experience timeline with polished transitions
- Dedicated sections for awards, skills, and featured work
- GitHub Pages deployment

---

## Sections Included

- **Hero** — intro, title, visual impact, quick stats
- **About** — personal summary, metrics, awards
- **Skills** — grouped technical strengths
- **Experience** — career timeline and company roles
- **Projects** — featured and supporting portfolio work
- **Contact** — contact form and social links
- **Footer** — navigation and copyright

---

## Project Structure

```bash
.
├── public/
├── src/
│   ├── components/
│   ├── data/
│   │   └── portfolio.js
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mohammadshaireefshaikh/Portfolio.git
cd Portfolio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Then open:

```bash
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
npm run preview
```

The production-ready output is generated inside the `dist/` folder.

---

## Content Management

All editable portfolio content lives in:

```bash
src/data/portfolio.js
```

You can update:

- personal details
- hero stats
- awards
- skills
- experience
- projects
- links and CV URL

---

## Add a CV

Place the PDF file in:

```bash
public/cv-mohammad-shaikh.pdf
```

Then reference it through the portfolio data config if needed.

---

## Contact Form Setup

The contact form logic lives in:

```bash
src/components/Contact.jsx
```

To connect it to a real backend, replace the demo timeout with a provider such as **Formspree** or **EmailJS**.

Example:

```js
await fetch("https://formspree.io/f/YOUR_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
```

---

## Main Components

| Component | Purpose |
|---|---|
| `Navbar.jsx` | Sticky blur navigation with mobile menu |
| `Hero.jsx` | Main hero section with animated intro |
| `OrbVisual.jsx` | Orbital visuals and floating stat UI |
| `GlassButton.jsx` | Glassmorphism-inspired CTA button |
| `About.jsx` | Bio, stats, and awards section |
| `Skills.jsx` | Grouped technical skills |
| `Experience.jsx` | Animated timeline of experience |
| `Projects.jsx` | Featured work and interactive project cards |
| `Contact.jsx` | Contact form and social links |
| `Footer.jsx` | Footer navigation and copyright |
| `Icons.jsx` | GitHub and LinkedIn SVG icons |
| `AnimatedSection.jsx` | Shared scroll reveal wrapper |

---

## Deployment

This portfolio is deployed with **GitHub Pages**.

Live URL:

**[https://mohammadshaireefshaikh.github.io/Portfolio/](https://mohammadshaireefshaikh.github.io/Portfolio/)**

If using Vite for GitHub Pages, make sure the correct base path is configured in `vite.config.js`.

---

## Design Direction

The portfolio aims for a premium, product-style feel inspired by Apple-style presentation:

- restrained visual hierarchy
- motion-led storytelling
- strong typography and spacing
- minimal but expressive UI
- clean presentation of work and experience

---

## Author

**Mohammad Shaikh**  
Developer Portfolio  
GitHub: [mohammadshaireefshaikh](https://github.com/mohammadshaireefshaikh)  
Portfolio: [mohammadshaireefshaikh.github.io/Portfolio](https://mohammadshaireefshaikh.github.io/Portfolio/)

---

## License

This project is for personal portfolio use. Reuse of the design, branding, or content should be done only with permission from the author.
