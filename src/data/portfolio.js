// ─── EDIT ALL PORTFOLIO CONTENT HERE ───────────────────────────────────────

export const personal = {
  name: "Mohammad Shaikh",
  title: "XR & Unity3D Engineer",
  subtitle: "Full Stack Developer",
  tagline: "Building immersive experiences and scalable systems.",
  bio: "Software engineer with 3+ years building high-performance systems across XR and full-stack. From real-time robotic hand control on Meta Quest 3 to cloud-deployed React dashboards — I build things that work at depth.",
  location: "Liverpool, United Kingdom",
  email: "shaikh.mohammad1099@gmail.com",
  github: "https://github.com/mohammadshaikh",
  linkedin: "https://linkedin.com/in/mohammadshaikh",
  cvUrl: "/cv-mohammad-shaikh.pdf",
};

export const stats = [
  { value: "3+", label: "Years Experience" },
  { value: "MSc", label: "University of Liverpool" },
  { value: "<20ms", label: "XR Precision" },
  { value: "2025", label: "Google Cloud Winner" },
];

export const awards = [
  {
    title: "Winner — Google Cloud London Summit 2025",
    subtitle: "gHacks Hackathon",
    detail: "Led development of a cloud-native solution leveraging Google Cloud. Recognised as a UK standout AI innovator.",
    year: "2025",
  },
  {
    title: "Team of the Quarter",
    subtitle: "Infogen Labs Inc.",
    detail: "Awarded for outstanding contribution to innovation and delivery excellence.",
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
    description: "Built a Unity3D XR application for Meta Quest 3 enabling real-time robotic hand control with sub-20ms precision. Designed and deployed a full-stack web application (React.js, Node.js, Firebase) for robotic ecosystem management.",
    highlights: [
      "Real-time hand tracking → physical robot control, sub-20ms latency",
      "Native Unity–Android plugin bridging for hardware communication",
      "Full-stack dashboard with Firebase real-time data pipelines",
      "Recognised as UK standout AI innovator by Google Cloud",
    ],
    badge: "Google Cloud AI Innovator",
  },
  {
    role: "Unity Developer",
    company: "Eccentric",
    period: "May 2022 – Aug 2023",
    location: "Mumbai, India",
    description: "Led overhaul of digital showroom applications for MG, Maruti Suzuki, and Jeep — boosting usage 20%, improving customer satisfaction 15%, and cutting support tickets 30%.",
    highlights: [
      "20% increase in product usage across automotive showrooms",
      "Cross-platform (Windows & iOS) analytics dashboard with Mapbox",
      "Photorealistic 3D rendering pipelines in Unity3D",
      "15% improvement in customer satisfaction scores",
    ],
    badge: null,
  },
  {
    role: "Junior Software Developer",
    company: "Infogen Labs Inc.",
    period: "Dec 2021 – May 2022",
    location: "Pune, India",
    description: "Contributed to two innovative projects: 'Axe Throw' (physical-digital hybrid with computer vision) and 'GLUV' (AR retail sizing app using ARKit). Awarded Team of the Quarter.",
    highlights: [
      "'GLUV' — AR retail app with ARKit for in-store size verification",
      "'Axe Throw' — computer vision detecting physical impact positions",
      "Team of the Quarter award for innovation excellence",
    ],
    badge: "Team of the Quarter",
  },
];

export const projects = [
  {
    title: "Real-Time Robotic Hand Control XR",
    description: "Full XR application enabling real-time hand tracking to control physical robots on Meta Quest 3. Low-latency signal handling, native Unity–Android bridging, and cloud-driven telemetry via GCP.",
    tech: ["Unity3D", "Meta Quest 3", "Android Native Plugins", "GCP", "C#"],
    github: null,
    demo: null,
    featured: true,
    year: "2025",
    impact: "Sub-20ms precision",
  },
  {
    title: "Automotive Digital Showroom",
    description: "Interactive 3D digital showrooms for MG, Maruti Suzuki, and Jeep. Real-time dashboards, Mapbox integration, and photorealistic vehicle visualization. Boosted engagement 20%, slashed support overhead 30%.",
    tech: ["Unity3D", "JSON", "Mapbox API", "REST APIs", "C#"],
    github: null,
    demo: null,
    featured: true,
    year: "2022–2023",
    impact: "+20% engagement",
  },
  {
    title: "ConicalGaufres AR",
    description: "Augmented reality menu experience for a Belgian waffle brand. Customers scan packaging to see 3D product previews, nutritional info, and ordering flow — all in AR.",
    tech: ["Unity3D", "AR Foundation", "ARCore", "ARKit", "C#"],
    github: "https://github.com/mohammadshaikh/conicalgaufres-ar",
    demo: null,
    featured: false,
    year: "2023",
    impact: null,
  },
  {
    title: "M.A.D — My Assignments Done",
    description: "Full-stack assignment management platform. Real-time collaboration, deadline tracking, file sharing, and notification system.",
    tech: ["React", "Python", "FastAPI", "PostgreSQL", "Docker"],
    github: "https://github.com/mohammadshaikh/mad-assignments",
    demo: null,
    featured: false,
    year: "2024",
    impact: null,
  },
];
