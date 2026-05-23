// ─── EDIT ALL PORTFOLIO CONTENT HERE ───────────────────────────────────────

export const personal = {
  name: "Mohammad Shaikh",
  title: "XR & Unity3D Engineer",
  subtitle: "Full Stack Developer",
  tagline: "I build XR apps and web software.",
  bio: "Software engineer with 3 years of experience. I build XR apps in Unity and full-stack web tools, most recently an app that lets you control a physical robot with your hands on a Meta Quest 3.",
  location: "Liverpool, United Kingdom",
  email: "shaikh.mohammad1099@gmail.com",
  github: "https://github.com/mohammadshaikh",
  linkedin: "https://linkedin.com/in/mohammadshaikh",
  cvUrl: "/cv-mohammad-shaikh.pdf",
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
    title: "Real-Time Robotic Hand Control XR",
    description: "An XR app on Meta Quest 3 that lets you move your hands to control a real robot. Robot data flows through Google Cloud.",
    tech: ["Unity3D", "Meta Quest 3", "Android Native Plugins", "GCP", "C#"],
    github: null,
    demo: null,
    featured: false,
    year: "2025",
  },
  {
    title: "Automotive Digital Showroom",
    description: "3D showroom apps for car dealerships MG, Maruti Suzuki, and Jeep. Customers could explore vehicles in detail. Staff had a dashboard with usage stats and Mapbox location data. Usage went up 20%, support requests dropped 30%.",
    tech: ["Unity3D", "JSON", "Mapbox API", "REST APIs", "C#"],
    github: null,
    demo: null,
    featured: false,
    year: "2022–2023",
    impact: "+20% usage",
  },
  {
    title: "Unity Essentials-My First Unity Project",
    description: "Built as part of the Unity Essentials Pathway, this project covers the foundational skills of Unity 6, including scene creation, GameObjects and components, materials and lighting, audio, and basic scripting. This was my first hands-on experience bringing together the core tools and workflows of the Unity Editor to create an interactive 3D and 2D experience.",
    tech: ["Unity3D", "C#", "WebGL", "Computer Vision"],
    github: null,
    demo: "https://play.unity.com/en/games/443610c3-e1f8-4310-90f2-737dad5d74f7/unity-essentials-portfolio-demo",
    demoLabel: "Play Now",
    featured: false,
    year: "2022",
    impact: null,
  },
  {
    title: "Marbles Battle Royale",
    description: "Multiplayer marble arena game built in Unity. Roll your marble around a 3D map and knock other players off the edge. Real-time netcode via Photon Fusion 2, customizable marble skins, and multiple maps. Built at the University of Liverpool.",
    tech: ["Unity3D", "C#", "Photon Fusion 2", "WebGL"],
    github: "https://github.com/mohammadshaireefshaikh/Marbles-Battle-Royale-Game",
    demo: null,
    featured: true,
    year: "2024",
    impact: null,
    image: "/img/marbles-battle-royale.png",
  },
  {
    title: "ConicalGaufres AR",
    description: "An AR app for a Belgian waffle brand. Point your phone at the packaging and you see a 3D version of the product, nutrition info, and a way to order, without leaving the camera.",
    tech: ["Unity3D", "AR Foundation", "ARCore", "ARKit", "C#"],
    github: "https://github.com/mohammadshaikh/conicalgaufres-ar",
    demo: null,
    featured: true,
    year: "2023",
    impact: null,
    image: "/img/conical-gaufres.png",
  },
  {
    title: "M.A.D — My Assignments Done",
    description: "A web app for managing university assignments. Track deadlines, share files, work with teammates, and get notified when things change.",
    tech: ["React", "Python", "FastAPI", "PostgreSQL", "Docker"],
    github: "https://github.com/mohammadshaikh/mad-assignments",
    demo: null,
    featured: false,
    year: "2024",
    impact: null,
  },
];
