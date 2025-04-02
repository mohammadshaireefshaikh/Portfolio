import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  html,
  css,
  reactjs,
  nodejs,
  mongodb,
  git,
  csharp,
  unity,
  python,
  cpp,
  mysql,
  github,
  aws,
  project2,
  project1,
  project3,
} from "../assets";
import currys from '../assets/company/currys.png';
import tekntrash from '../assets/company/tekntrash.png';
import eccentric from '../assets/company/eccentric.png';
import infogen from '../assets/company/infogen.png';
// import project2 from '../assets/project2.png'

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "Full-Stack Developer",
    icon: web,
  },
  {
    title: "Frontend Developer",
    icon: mobile,
  },
  {
    title: "Backend Developer",
    icon: backend,
  },
  {
    title: "Unity3D developer",
    icon: creator,
  },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "C#",
    icon: csharp,
  },
  {
    name: "Unity#",
    icon: unity,
  },
  {
    name: "Python#",
    icon: python,
  },
  {
    name: "C++",
    icon: cpp,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },

  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "MongoDB",
    icon: mongodb,
  },
  {
    name: "mysql",
    icon: mysql,
  },
  {
    name: "git",
    icon: git,
  },
  {
    name: "github",
    icon: github,
  },
  {
    name: "aws",
    icon: aws,
  },
];

const experiences = [
  {
    title: "Software Engineer",
    company_name: "TeknTrash Robotics",
    icon: tekntrash,
    iconBg: "#383E56",
    date: "Mar 2025 – Present",
    points: [
      "Developing Unity3D app to control robotic hand via Meta Quest input.",
      "Enabling real-time interaction and testing of robotic response.",
    ],
  },//TODO
  {
    title: "Sales Colleague ",
    company_name: "Currys ",
    icon: currys,
    iconBg: "#383E56",
    date: "Jul 2024 – Present",
    points: [
      "Enhanced Communication Skills, Engaging with a diverse range of customers daily improved my ability to adapt my communication style, energetically listen, and convey information clearly to meet customer needs.  ",
      "Improved Customer Handling & Problem-Solving, Managing several customer interactions helped me develop patience, empathy, and quick problem-solving skills, ensuring positive experiences even in challenging situations.  ",
    ],
  },
  {
    title: "Software Engineer",
    company_name: "Eccentric",
    icon: eccentric,
    iconBg: "#383E56",
    date: "May 2022 – Aug 2023",
    points: [
      "Developed and optimized Digital Showroom for MG & Maruti Suzuki using Unity3D, implementing unit testing and improving UI/UX for a smoother user experience. ",
      "Built a dashboard application for Jeep & MG using Unity3D with JSON integration for analytics and data visualization, ensuring cross-platform support on Windows & iOS. ",
      "Integrated Mapbox API and real-time data APIs for vehicle connectivity insights. Worked with 3D assets, rendering pipelines, and UI frameworks for showroom visualization",
    ], 
  },
  {
    title: "Jr. Unity Developer",
    company_name: "Infogen Labs inc.",
    icon: infogen,
    iconBg: "#383E56",
    date: "May 2022 – Aug 2023",
    points: [
      "Honored as Team of the Quarter for achieving a 30% improvement in client satisfaction and meeting project deadlines ahead of schedule.",
      "Integrated AR capabilities into GLUV software using Unity Engine and ARKit for immersive user experiences.  ",
      "Integrated Cloud Points technology to enhance performance and scalability, allowing real-time access to critical data. ",
      "Designed intricate lingerie models within Unity3D using Cloud Points for precise size verification.  ",
      "Developed GLUV software with Unity3D and C#, establishing robust and seamless user experience.  ",
      "Established continuous optimization and iteration processes to refine performance and accuracy. ",
      "Reviewed over 200 user feedback submissions, leading to a 40% reduction in system crashes and elevating overall reliability.",
    ], 
  },
];

const testimonials = [
  
];

const projects = [
  {
    name: "ConicalGaufres AR",
    description:
      "Mobile AR website offering 3D waffle customization with store locator, social links, and a feedback system.",
    tags: [
      {
        name: "Unity3D",
        color: "blue-text-gradient",
      },
      {
        name: "AR",
        color: "green-text-gradient",
      },
      {
        name: "JavaScript",
        color: "orange-text-gradient",
      },
    ],
    image: project2,
    source_code_link: "https://mohammadshaireefshaikh.github.io/ConicalGaufres.github.io/",
  },
  {
    name: "Marbles Battle Royale",
    description:
      "A physics-based multiplayer game where players control marbles in a dynamic 3D arena. Supports real-time interaction with Photon Fusion and marble skin customization.",
    tags: [
      { name: "Unity3D", color: "blue-text-gradient" },
      { name: "Photon Fusion", color: "pink-text-gradient" },
      { name: "C#", color: "green-text-gradient" },
    ],
    image: project1,
    source_code_link: "https://liverpool.instructuremedia.com/embed/a3f5a23e-423d-4736-94d5-c2710b268a99",
  },
  {
    name: "M.A.D - My Assignments Done",
    description:
      "A platform for students to access notes, code snippets, diagrams, and educational videos. Designed for faster learning and better document management.",
    tags: [
      { name: "PHP", color: "blue-text-gradient" },
      { name: "JavaScript", color: "orange-text-gradient" },
      { name: "YouTube API", color: "pink-text-gradient" },
    ],
    image: project3, 
    source_code_link: "https://github.com/mohammadshaireefshaikh/M.A.D-My-Assignments-Done",
  },
];

export { services, technologies, experiences, testimonials, projects };
