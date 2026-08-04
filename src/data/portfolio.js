// ─── EDIT ALL PORTFOLIO CONTENT HERE ───────────────────────────────────────

export const personal = {
  name: "Mohammad Shaikh",
  title: "XR & Unity3D Engineer",
  subtitle: "Full Stack Developer",
  tagline: "I build XR apps and web software.",
  bio: "Software engineer with 3 years of experience. I build XR apps in Unity and full-stack web tools, most recently an app that lets you control a physical robot with your hands on a Meta Quest 3.",
  location: "Liverpool, United Kingdom",
  email: "shaikh.mohammad1099@gmail.com",
  github: "https://github.com/mohammadshaireefshaikh",
  linkedin: "https://www.linkedin.com/in/mohammad-shaikh1005/",
  cvUrl: `${import.meta.env.BASE_URL}cv-mohammad-shaikh.pdf`,
};

export const stats = [
  { value: "3+", label: "Years Experience" },
  { value: "MSc", label: "University of Liverpool" },
  { value: "2025", label: "Google Cloud Winner" },
];

export const awards = [
  {
    title: "Winner — Google Cloud London Summit 2025",
    subtitle: "gHacks Hackathon",
    detail: "Won Google's London hackathon by building a cloud-based AI tool from scratch in a day. Google named our team one of the top AI projects in the UK.",
    year: "2025",
  },
  {
    title: "Team of the Quarter",
    subtitle: "Infogen Labs Inc.",
    detail: "Team recognition award at Infogen. We shipped good work consistently and the people we worked with noticed.",
    year: "2022",
  },
];

export const skills = [
  {
    category: "XR & Realtime",
    items: ["Unity3D", "C#", "Meta Quest SDK", "ARKit", "AR Foundation", "Hand Tracking", "XR Interaction Toolkit", "Computer Vision"],
  },
  {
    category: "Languages",
    items: ["C#", "C++", "Python", "JavaScript", "Java", "SQL"],
  },
  {
    category: "Frontend & Backend",
    items: ["React.js", "Node.js", ".NET", "REST APIs", "Firebase", "WebSockets"],
  },
  {
    category: "Cloud & DevOps",
    items: ["Google Cloud Platform", "Firebase", "Azure", "Git", "CI/CD", "Android Native Plugins", "Mapbox"],
  },
];

export const experience = [
  {
    role: "Software Engineer",
    company: "TeknTrash Robotics",
    period: "Mar 2025 – Oct 2025",
    location: "Liverpool, UK",
    description: "Built a Unity XR app on Meta Quest 3 that lets you control a physical robot with your hands in real time. Also built the web dashboard the team uses to monitor and manage the robot's data and connections.",
    highlights: [
      "Hand tracking → physical robot control",
      "Native Unity–Android plugin to talk directly to the hardware",
      "Web dashboard with live data via Firebase",
      "Won Google's London hackathon, named a top AI team in the UK",
    ],
    badge: "Google Cloud AI Innovator",
  },
  {
    role: "Unity Developer",
    company: "Eccentric",
    period: "May 2022 – Aug 2023",
    location: "Mumbai, India",
    description: "Rebuilt the 3D showroom apps used by MG, Maruti Suzuki, and Jeep dealerships. Usage went up 20%, customers were happier, and support requests dropped 30%.",
    highlights: [
      "20% increase in product usage across dealership showrooms",
      "Analytics dashboard on Windows and iOS with Mapbox location data",
      "3D vehicle rendering in Unity",
      "15% improvement in customer satisfaction scores",
    ],
    badge: null,
  },
  {
    role: "Junior Software Developer",
    company: "Infogen Labs Inc.",
    period: "Dec 2021 – May 2022",
    location: "Pune, India",
    description: "Worked on two projects: Axe Throw, where computer vision detects where a physical axe hits a board and tracks scores, and GLUV, an AR app that helps store customers find the right glove size using their phone.",
    highlights: [
      "'GLUV' — AR app with ARKit to help customers find the right glove size in-store",
      "'Axe Throw' — computer vision tracking where a real axe lands on a board",
      "Team of the Quarter award",
    ],
    badge: "Team of the Quarter",
  },
];

export const projects = [
  {
    id: "dealcalculator",
    title: "DealCalculator — Currys Retail Tool",
    description: "A one-page calculator built for Currys / Carphone Warehouse staff to close mobile phone deals fast. Now getting picked up by retail teams across the UK.",
    tech: ["HTML", "CSS", "JavaScript", "GitHub Actions", "Playwright"],
    github: "https://github.com/mohammadshaireefshaikh/DealCalculator",
    demo: "https://mohammadshaireefshaikh.github.io/DealCalculator/",
    demoLabel: "Try It",
    year: "2026",
    impact: "Used by Currys staff across UK",
    longDescription: [
      "Mobile phone deals are hard to compare honestly. One has a big upfront cost and a low monthly, another is £0 upfront with a higher monthly, and both are subject to annual April price increases — so the sticker prices never tell the real story.",
      "DealCalculator was built for shop-floor use: a large-type, mobile-responsive, two-column calculator where staff enter the numbers in front of the customer and instantly see the total cost of each option over the full term, which one is cheaper, and the exact saving.",
      "Ticking 'Price increase every April' applies a per-month rise from each April in the term (a typical 24-month contract catches two), and every deal renders a payment roadmap — dated segments showing exactly what the customer pays and when, like a printed quote.",
      "The whole product is one dependency-free HTML file with embedded CSS, JS and fonts, tested headlessly with Playwright, and continuously deployed to GitHub Pages via GitHub Actions.",
    ],
    highlights: [
      "Live recalculation on every keystroke — no submit button",
      "Correctly models UK April price rises based on contract start month",
      "Dated payment roadmap: 'Jul 2026 – Mar 2027 · 9 × £35/mo · £315.00'",
      "Zero external requests — fonts embedded as woff2 data URIs",
      "Playwright-tested behaviour: both modes, edge cases, tie detection",
    ],
  },
  {
    id: "swing-state",
    title: "Swing State: Rage Edition",
    description: "Physics-based endless climbing game. Two web-shooters, pendulum momentum, and 2-player online co-op. Getting Over It punishment meets Spider-Man traversal.",
    tech: ["Unity 6", "C#", "URP", "Netcode for GameObjects", "Unity Cloud Save", "WebGL"],
    github: null,
    demo: "https://play.unity.com/en/games/c197861d-7c2b-4413-a1bc-f2b150d9a047/swing-state",
    demoLabel: "Play Now",
    year: "2026",
    impact: "In development",
    longDescription: [
      "A physics-based endless climbing game. The player scales an infinite tower of floating rock islands using two web-shooters — grapple lines fired from each hand that can be reeled in or slackened to build pendulum momentum.",
      "Score is how high you climb. Death is falling too far below your peak. Solo, or 2-player online co-op where a rope tether physically links both players. Accounts are required, and progress + settings sync to Unity Cloud Save.",
      "Technically notable: the whole thing runs in a 2.5D constraint (true 3D physics locked to the z = 0 plane), the swing is not scripted movement but a real SpringJoint that physics resolves into a pendulum, and reeling actually pumps energy into the swing — which had to be capped or velocity would compound without limit.",
      "Currently in active solo development. Windows / Steam is the eventual target.",
    ],
    highlights: [
      "Dual grapple with SpringJoint physics — real pendulum, real momentum",
      "Online co-op with a physical rope tether linking both players",
      "Custom netcode via Unity's Netcode for GameObjects + Unity Relay",
      "Live day → dusk → night cycle driven by climb height",
      "Cloud-synced accounts and profiles (Unity Authentication + Cloud Save)",
    ],
  },
  {
    id: "robotic-hand-xr",
    title: "Real-Time Robotic Hand Control XR",
    description: "An XR app on Meta Quest 3 that lets you move your hands to control a real robot. Robot data flows through Google Cloud.",
    tech: ["Unity3D", "Meta Quest 3", "Android Native Plugins", "GCP", "C#"],
    github: null,
    demo: null,
    year: "2025",
    impact: "Google Cloud AI Innovator",
    longDescription: [
      "An XR app on Meta Quest 3 that lets a user control a physical robot using their hands in real time. Hand tracking data is captured on the headset and streamed to the robot; telemetry from the robot flows back through Google Cloud.",
      "Built at TeknTrash Robotics. Includes a native Unity–Android plugin written from scratch to talk directly to the robot hardware, and a web dashboard the team uses to monitor connections and data in real time via Firebase.",
      "This project also helped win Google's London hackathon in 2025, where the team was named one of the top AI projects in the UK.",
    ],
    highlights: [
      "Hand tracking mapped directly to physical robot control",
      "Custom Unity–Android native plugin for direct hardware comms",
      "Web dashboard with live data streaming via Firebase",
      "Won Google Cloud London Summit 2025 hackathon (gHacks)",
    ],
  },
  {
    id: "automotive-showroom",
    title: "Automotive Digital Showroom",
    description: "3D showroom apps for car dealerships MG, Maruti Suzuki, and Jeep. Usage went up 20%, support requests dropped 30%.",
    tech: ["Unity3D", "JSON", "Mapbox API", "REST APIs", "C#"],
    github: null,
    demo: null,
    year: "2022–2023",
    impact: "+20% usage",
    longDescription: [
      "Rebuilt the 3D showroom apps used by MG, Maruti Suzuki, and Jeep dealerships in India. Customers could explore vehicles in full 3D detail; staff had a separate analytics dashboard showing usage stats and Mapbox location data.",
      "Shipped and measured: product usage went up 20% across dealership showrooms, customer satisfaction scores improved 15%, and support requests dropped 30%.",
    ],
    highlights: [
      "20% increase in product usage across dealerships",
      "15% improvement in customer satisfaction scores",
      "30% drop in support requests",
      "Analytics dashboard on Windows and iOS with Mapbox location data",
    ],
  },
  {
    id: "unity-essentials",
    title: "Unity Essentials — My First Unity Project",
    description: "Built as part of the Unity Essentials Pathway. First hands-on experience with the core Unity Editor workflows.",
    tech: ["Unity3D", "C#", "WebGL"],
    github: null,
    demo: "https://play.unity.com/en/games/443610c3-e1f8-4310-90f2-737dad5d74f7/unity-essentials-portfolio-demo",
    demoLabel: "Play Now",
    year: "2022",
    impact: null,
    longDescription: [
      "Built as part of the Unity Essentials Pathway. Covers foundational Unity 6 skills: scene creation, GameObjects and components, materials and lighting, audio, and basic scripting.",
      "This was my first hands-on experience bringing together the core tools and workflows of the Unity Editor to create an interactive 3D and 2D experience.",
    ],
  },
  {
    id: "marbles-battle-royale",
    title: "Marbles Battle Royale",
    description: "Multiplayer marble arena game built in Unity. Real-time netcode via Photon Fusion 2. Built at the University of Liverpool.",
    tech: ["Unity3D", "C#", "Photon Fusion 2", "WebGL"],
    github: "https://github.com/mohammadshaireefshaikh/Marbles-Battle-Royale-Game",
    demo: null,
    year: "2024",
    impact: null,
    image: "/img/marbles-battle-royale.png",
    longDescription: [
      "Multiplayer marble arena game built in Unity. Roll your marble around a 3D map and knock other players off the edge.",
      "Uses Photon Fusion 2 for real-time netcode, with customizable marble skins and multiple maps. Built as part of an MSc project at the University of Liverpool.",
    ],
  },
  {
    id: "conicalgaufres-ar",
    title: "ConicalGaufres AR",
    description: "An AR app for a Belgian waffle brand. Point your phone at the packaging to see a 3D product, nutrition info, and a way to order.",
    tech: ["Unity3D", "AR Foundation", "ARCore", "ARKit", "C#"],
    github: "https://github.com/mohammadshaireefshaikh/conicalgaufres-ar",
    demo: null,
    year: "2023",
    impact: null,
    image: "/img/conical-gaufres.png",
    longDescription: [
      "AR app for a Belgian waffle brand. Point your phone at the packaging and you see a 3D version of the product, nutrition information, and a way to order — all without leaving the camera view.",
      "Cross-platform: iOS (ARKit) and Android (ARCore) via Unity's AR Foundation.",
    ],
  },
  {
    id: "mad-assignments",
    title: "M.A.D — My Assignments Done",
    description: "A web app for managing university assignments. Track deadlines, share files, collaborate, and get notified.",
    tech: ["React", "Python", "FastAPI", "PostgreSQL", "Docker"],
    github: "https://github.com/mohammadshaireefshaikh/mad-assignments",
    demo: null,
    year: "2024",
    impact: null,
    longDescription: [
      "Web app for managing university assignments. Track deadlines, share files, collaborate with teammates, and get notified when things change.",
      "Full-stack: React frontend, Python / FastAPI backend, PostgreSQL database, Docker for deployment.",
    ],
  },
];
