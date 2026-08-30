import { useState, useEffect, useRef } from 'react';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Code2,
  Film,
  Globe,
  Flame,
  Award,
  CheckCircle2,
  Monitor,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Zap,
  Layers,
  Search,
  Maximize2,
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Compass,
  Music2,
  SlidersHorizontal,
} from 'lucide-react';

const FOUNDER_INFO = {
  name: 'Gilbert Tuyambaze',
  title: 'Full-Stack Software Engineer & Web Designer',
  fellowship: 'A2SV Software Engineering Fellow & Creative Technologist',
  location: 'Kigali, Rwanda',
  email: 'tuyambazegilbert05@gmail.com',
  phone: '+250793438873',
  portfolioUrl: 'https://tuyambaze-gilbert.vercel.app/',
  githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
  linkedinUrl: 'https://www.linkedin.com/in/gilbert-tuyambaze-02044a3bb/',
  twitterUrl: 'https://twitter.com/Gilbert_01_TZ',
  instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  instagramHandle: '@tuyambaze.gilbert_',
  facebookUrl: 'https://facebook.com/profile.php?id=10008431944042',
  images: {
    avatarLight: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-light.jpeg',
    avatarDark: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-dark.jpeg',
    businessCard: 'https://tuyambaze-gilbert.vercel.app/images/Bussiness-card-TUYAMBAZE-Gilbert.png',
    preview: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
  },
  skills: [
    'Frontend Engineering',
    'Full-Stack Architecture',
    'React & TypeScript',
    'Tailwind CSS',
    'UI/UX Design',
    'Video Streaming & YouTube Discovery',
    'Performance Optimization',
    'Creative Technologist',
    'A2SV Algorithm Engineering',
    'Music Production & Audio Engineering',
  ],
};

// Instagram & Founder Story Gallery Moments
const INSTAGRAM_MOMENTS = [
  {
    id: 'moment-1',
    title: 'Founder & Software Architect',
    subtitle: 'Studio & Cyber Portrait • Kigali, Rwanda',
    caption: 'Building next-generation web architectures, African cinema indexing systems, and high-performance digital products from Kigali to the world 🇷🇼✨ #SoftwareEngineering #KigaliTech #A2SV #OrangeFlix',
    url: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-dark.jpeg',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-light.jpeg',
    likes: '1,420',
    comments: '88',
    date: 'Recently shared',
    tag: 'Instagram Spotlight',
    category: 'portraits',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-2',
    title: 'Creative Technologist & Engineer',
    subtitle: 'A2SV Fellowship & Engineering Leadership',
    caption: 'Passion, precision, and purpose. Solving complex data structures and building scalable software that makes a real continental impact. 🚀💻 #DeveloperLife #CreativeTech #RwandaDev',
    url: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-light.jpeg',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-dark.jpeg',
    likes: '1,890',
    comments: '124',
    date: 'Featured',
    tag: 'Creator Story',
    category: 'portraits',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-3',
    title: 'OrangeFlix Cinema Architecture',
    subtitle: 'Streaming, 3D UX & Multi-Country Pipeline',
    caption: 'OrangeFlix 2.0: Unifying African storytelling with Hollywood prestige. 3D card staging slider, automated 3x-a-week YouTube discovery, and zero-latency caching live on the web! 🎬🍿 #OrangeFlix #AfricanCinema #WebDev',
    url: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/assets/orangeflix.png',
    likes: '2,640',
    comments: '215',
    date: 'Platform Launch',
    tag: 'Flagship Platform',
    category: 'platforms',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-4',
    title: 'Brand Identity & Professional Credentials',
    subtitle: 'Full-Stack Developer • Web Designer • Producer',
    caption: 'Official personal brand and identity card. Available for bespoke enterprise web solutions, UI/UX consulting, and creative tech collaborations. 💼🏷️ #PersonalBrand #TechLeadership #GilbertTuyambaze',
    url: 'https://tuyambaze-gilbert.vercel.app/images/Bussiness-card-TUYAMBAZE-Gilbert.png',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/gilbert-tuyambaze-light.jpeg',
    likes: '960',
    comments: '46',
    date: 'Brand Milestone',
    tag: 'Identity',
    category: 'brand',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-5',
    title: 'MarketPlace Pro Architecture',
    subtitle: 'Enterprise Role-Based Commerce Suite',
    caption: 'Engineered MarketPlace Pro with full role-based access control, integrated real-time chat, claim management, notifications, and payment processing. 💳📦 #FullStack #NextJS #EnterpriseWeb',
    url: 'https://tuyambaze-gilbert.vercel.app/assets/marketplacepro.png',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    likes: '1,530',
    comments: '79',
    date: 'Project Milestone',
    tag: 'Enterprise App',
    category: 'platforms',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-6',
    title: 'UR Academic Resource Hub',
    subtitle: 'University of Rwanda Student Paper Hub',
    caption: 'Giving back to the student community: Built a centralized academic resource and past paper hub with FastAPI, SQLAlchemy, and Firebase authentication. 📚🎓 #EdTech #UniversityOfRwanda #FastAPI',
    url: 'https://tuyambaze-gilbert.vercel.app/assets/ur-academic-resource-hub.png',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    likes: '1,780',
    comments: '112',
    date: 'Academic Hub',
    tag: 'Community',
    category: 'platforms',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
  {
    id: 'moment-7',
    title: 'BeatFlow Music & Sound Studio',
    subtitle: 'Creative Direction & Audio Engineering',
    caption: 'When code meets sound: crafting original scores, sound design, and audio streaming experiences for cinema and creative media. 🎧🎶 #MusicProduction #SoundDesign #CreativeTechnologist',
    url: 'https://tuyambaze-gilbert.vercel.app/assets/archive.png',
    fallbackUrl: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    likes: '1,920',
    comments: '140',
    date: 'Creative Tech',
    tag: 'Audio Studio',
    category: 'creative',
    instagramUrl: 'https://www.instagram.com/tuyambaze.gilbert_/',
  },
];

// All 12 Projects directly from https://tuyambaze-gilbert.vercel.app/
const PORTFOLIO_PROJECTS = [
  {
    id: 'orangeflix',
    title: 'OrangeFlix Cinema 2.0',
    slug: 'movie-streaming-site',
    type: 'Cinema & Streaming Platform',
    category: 'fullstack',
    summary: 'Full-featured African & global cinema platform with auth, admin features, 3D UX & auto-discovery.',
    description:
      'A premiere movie & television streaming platform with user-friendly UI, authentication flows, automated 3x/week YouTube multi-country discovery engine, 10-minute multi-tier caching, and rich soundtrack playback.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/orangeflix.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Firebase', 'YouTube API', 'Vite'],
    liveUrl: 'https://orangeflixx.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/orangeflixx',
    highlight: 'Active Production (Flagship)',
  },
  {
    id: 'marketplace-pro',
    title: 'MarketPlace Pro',
    slug: 'marketplace-pro',
    type: 'Web Development',
    category: 'fullstack',
    summary: 'Multi-role marketplace with chat, payments, announcements, and claims support.',
    description:
      'A full-stack marketplace web app with support for multiple user roles including buyer, seller, editor, content manager, and admin. Features role-based access control, claims support, advanced chat, notifications, payment support, and a modern UI.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/marketplacepro.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['Next.js', 'TypeScript', 'Vite', 'shadcn-ui', 'Tailwind', 'Firebase', 'React'],
    liveUrl: 'https://marketplacepro.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/MarketPlace-Pro',
    highlight: 'Enterprise Marketplace',
  },
  {
    id: 'ur-hub',
    title: 'UR Academic Resource Hub',
    slug: 'ur-academic-resource-hub',
    type: 'Web Development',
    category: 'fullstack',
    summary: 'Academic resource platform with uploads, moderation, auth, and search.',
    description:
      'A full-stack academic resource platform for University of Rwanda students with Firebase auth, user profiles, paper uploads, moderation, and a FastAPI plus SQLAlchemy backend.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/ur-academic-resource-hub.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'TypeScript', 'Vite', 'FastAPI', 'SQLAlchemy', 'Firebase'],
    liveUrl: 'https://paperhubur.vercel.app',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/UR-PAST-PAPER-HUB',
    highlight: 'University Platform',
  },
  {
    id: 'nyagatare-school',
    title: 'Nyagatare Secondary School Website',
    slug: 'nyagatare-secondary-school',
    type: 'Web Development',
    category: 'webapps',
    summary: 'Modern school platform with public pages, assistant features, and Firebase integration.',
    description:
      'A modern school website built with React, TypeScript, Vite, Tailwind CSS, and shadcn-ui. Includes pages for events, enrollment, donations, board members, and a public AI assistant.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/nss.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn-ui', 'Firebase'],
    liveUrl: 'https://nyagatare-secondary-school.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
    highlight: 'Education Tech',
  },
  {
    id: 'private-couple-chat',
    title: 'Private Couple Chat (OurNests)',
    slug: 'private-couple-chat',
    type: 'Web & Mobile App',
    category: 'webapps',
    summary: 'Private real-time chat app with web, desktop, and mobile clients.',
    description:
      'A full-stack private chat app featuring real-time messaging with Socket.IO, secure authentication with JWT, end-to-end media sharing, and multi-platform clients.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/privatecouplechat.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'Node.js', 'Express', 'Socket.IO', 'MongoDB', 'Electron', 'Expo'],
    liveUrl: 'https://ournests.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/chatApp',
    highlight: 'Real-Time Socket.IO',
  },
  {
    id: 'tour-booking',
    title: 'Tour Booking & Exploring',
    slug: 'tour-booking-exploring',
    type: 'Web Development',
    category: 'webapps',
    summary: 'Responsive tour booking experience with smooth animation and booking flow.',
    description:
      'A responsive tour booking and exploring platform with full tour showcases, interactive booking flows, smooth animations, and high-conversion UX.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/tour.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Vite'],
    liveUrl: 'https://winning4tours.com',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
    highlight: 'Tourism & Booking',
  },
  {
    id: 'consulting-platform',
    title: 'Consulting Platform (Bright Bridge)',
    slug: 'consulting-platform',
    type: 'Web Development',
    category: 'webapps',
    summary: 'Consulting website with services, forms, and polished motion.',
    description:
      'A responsive enterprise consulting platform showcasing consulting services, lead generation forms, and smooth motion design.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/bright.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'TypeScript', 'Next.js', 'HTML5', 'CSS3'],
    liveUrl: 'https://bright-bridge.vercel.app',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
    highlight: 'Corporate Advisory',
  },
  {
    id: 'online-learning',
    title: 'Online Learning Platform (Twigane Class)',
    slug: 'online-learning-platform',
    type: 'Web Development',
    category: 'fullstack',
    summary: 'Learning platform with auth and a user-friendly study experience.',
    description:
      'A responsive online education portal with student authentication, course material delivery, and interactive study modules.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/twigane-class.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['Supabase', 'React', 'Node.js', 'Next.js', 'Vite'],
    liveUrl: 'https://twigane-class.vercel.app',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
    highlight: 'EdTech & Courses',
  },
  {
    id: 'tuyizere-tresor-portfolio',
    title: 'Tuyizere Tresor Portfolio Website',
    slug: 'tuyizere-tresor-portfolio',
    type: 'Personal Portfolio',
    category: 'portfolios',
    summary: 'Personal portfolio platform with modern design and project storytelling.',
    description:
      'A professional portfolio platform designed to highlight skills, experience, and technical projects with interactive UI elements and responsive performance.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/tresor.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'JavaScript', 'Next.js', 'Vite'],
    liveUrl: 'https://tuyizere-tresor.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/Tresor-portfolio',
    highlight: 'Client Portfolio',
  },
  {
    id: 'aimable-portfolio',
    title: 'Aimable Bizimungu Portfolio',
    slug: 'aimable-bizimungu-portfolio',
    type: 'Personal Portfolio',
    category: 'portfolios',
    summary: 'Clean portfolio focused on elegance, performance, and professional clarity.',
    description:
      'A modern personal portfolio website built to showcase professional career experience, technical skills, and completed architectural projects.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/aimable.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'JavaScript', 'Next.js', 'Vite'],
    liveUrl: 'https://aimable-bizimungu.vercel.app/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/aimable-bizimungu',
    highlight: 'Client Portfolio',
  },
  {
    id: 'akimana-portfolio',
    title: 'AKIMANA Etienne Portfolio Website',
    slug: 'akimana-etienne-portfolio',
    type: 'Business & Portfolio',
    category: 'portfolios',
    summary: 'Business-forward portfolio with strong brand presentation and navigation.',
    description:
      'A modern, responsive business website designed to present commercial services, brand identity, and corporate information in a professional way.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/akimana.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['React', 'JavaScript', 'Next.js', 'Vite'],
    liveUrl: 'https://akimana.com/',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/akimana-etienne',
    highlight: 'Brand Showcase',
  },
  {
    id: 'music-interface',
    title: 'Music Streaming Interface (Ashola Studio)',
    slug: 'music-streaming-interface',
    type: 'UI/UX Design & Audio',
    category: 'creative',
    summary: 'Interface concept with visual storytelling and music-focused interaction design.',
    description:
      'A modern music streaming interface design with intuitive audio navigation, waveform rendering, and generative sound visual treatment.',
    image: 'https://tuyambaze-gilbert.vercel.app/assets/archive.png',
    fallbackImage: 'https://tuyambaze-gilbert.vercel.app/images/Screenshot-light.png',
    stack: ['ChatGPT', 'Suno AI', 'Leonardo AI', 'Runway AI', 'After Effects'],
    liveUrl: 'https://www.youtube.com/@ashola-1',
    githubUrl: 'https://github.com/GILBERT-Tuyambaze/',
    highlight: 'Audio & AI Visuals',
  },
];

export default function StoryBehind() {
  const [iframeKey, setIframeKey] = useState(0);

  // 1. Founder Story & Instagram 3D Showcase State
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);
  const [isAutoPlayMoments, setIsAutoPlayMoments] = useState(true);
  const [momentCategoryFilter, setMomentCategoryFilter] = useState<'all' | 'portraits' | 'platforms' | 'brand' | 'creative'>('all');
  const [lightboxMoment, setLightboxMoment] = useState<typeof INSTAGRAM_MOMENTS[0] | null>(null);
  const [momentProgress, setMomentProgress] = useState(0);

  // 2. 3D Project Showcase State
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isAutoPlayProjects, setIsAutoPlayProjects] = useState(true);
  const [projectFilter, setProjectFilter] = useState<'all' | 'fullstack' | 'webapps' | 'portfolios' | 'creative'>('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectProgress, setProjectProgress] = useState(0);

  // Filtered lists
  const filteredMoments = INSTAGRAM_MOMENTS.filter((m) =>
    momentCategoryFilter === 'all' ? true : m.category === momentCategoryFilter
  );

  const filteredProjects = PORTFOLIO_PROJECTS.filter((proj) => {
    const matchesCategory = projectFilter === 'all' ? true : proj.category === projectFilter;
    const matchesQuery = projectSearch.trim() === ''
      ? true
      : proj.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        proj.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
        proj.stack.some((s) => s.toLowerCase().includes(projectSearch.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const currentMoment = filteredMoments[activeMomentIndex % (filteredMoments.length || 1)] || INSTAGRAM_MOMENTS[0];
  const currentProject = filteredProjects[activeProjectIndex % (filteredProjects.length || 1)] || PORTFOLIO_PROJECTS[0];

  // Continuous Auto-Slide Timer with Progress Bar for Founder Story Moments (3.8s)
  useEffect(() => {
    if (!isAutoPlayMoments || filteredMoments.length <= 1) {
      setMomentProgress(0);
      return;
    }

    const intervalTime = 50; // tick every 50ms
    const totalDuration = 3800; // 3.8s total
    const increment = (intervalTime / totalDuration) * 100;

    const interval = setInterval(() => {
      setMomentProgress((prev) => {
        if (prev >= 100) {
          setActiveMomentIndex((idx) => (idx + 1) % filteredMoments.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isAutoPlayMoments, filteredMoments.length]);

  // Continuous Auto-Slide Timer with Progress Bar for Projects Showcase (4.5s)
  useEffect(() => {
    if (!isAutoPlayProjects || filteredProjects.length <= 1) {
      setProjectProgress(0);
      return;
    }

    const intervalTime = 50; // tick every 50ms
    const totalDuration = 4500; // 4.5s total
    const increment = (intervalTime / totalDuration) * 100;

    const interval = setInterval(() => {
      setProjectProgress((prev) => {
        if (prev >= 100) {
          setActiveProjectIndex((idx) => (idx + 1) % filteredProjects.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isAutoPlayProjects, filteredProjects.length]);

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'The Story Behind OrangeFlix — Built by Gilbert Tuyambaze',
    description:
      'The engineering journey, vision, and legacy behind OrangeFlix, created by Kigali-based full-stack software engineer Gilbert Tuyambaze.',
    publisher: {
      '@type': 'Person',
      name: 'Gilbert Tuyambaze',
      url: 'https://tuyambaze-gilbert.vercel.app/',
      jobTitle: 'Full-Stack Software Engineer & Web Designer',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kigali',
        addressCountry: 'Rwanda',
      },
      sameAs: [
        'https://tuyambaze-gilbert.vercel.app/',
        'https://github.com/GILBERT-Tuyambaze/',
        'https://www.linkedin.com/in/gilbert-tuyambaze-02044a3bb/',
        'https://www.instagram.com/tuyambaze.gilbert_/',
        'https://twitter.com/Gilbert_01_TZ',
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title="The Story Behind OrangeFlix — Built by Gilbert Tuyambaze | Kigali, Rwanda"
        description="Discover the story and legacy behind OrangeFlix, a cinema platform built by Kigali-based full-stack developer Gilbert Tuyambaze to unify African and global cinema storytelling."
        keywords="Gilbert Tuyambaze, Tuyambaze Gilbert, Kigali Rwanda web developer, African cinema streaming, OrangeFlix founder, A2SV software engineering fellow, React developer Rwanda, Kigali UI UX designer, MarketPlace Pro, UR Hub, Wakaliwood, Nollywood"
        url="https://orangeflixx.vercel.app/story-behind"
        jsonLd={jsonLdGraph}
      />

      <div className="page-wrap py-8 space-y-16">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'The Story Behind', url: '/story-behind' },
          ]}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.1] bg-[radial-gradient(ellipse_at_80%_20%,rgba(249,115,22,0.22),transparent_50%),linear-gradient(135deg,#0d1527_0%,#090d18_60%,#181028_100%)] p-6 sm:p-10 lg:p-14 shadow-2xl">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Founder & Creator Story</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Crafting the Future of <span className="text-orange-400">African & Global</span> Cinema Discovery.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                OrangeFlix is an honored creation engineered by{' '}
                <strong className="text-white font-bold">Gilbert Tuyambaze</strong>, a Kigali-based full-stack software engineer and A2SV fellow. Born out of a deep passion to bridge continental storytelling with world-class streaming performance.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1.5" /> Explore Gilbert's Live Portfolio
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs h-10 px-4 rounded-xl"
                >
                  <a href={FOUNDER_INFO.instagramUrl} target="_blank" rel="noreferrer">
                    <Instagram className="w-4 h-4 mr-1.5 text-pink-400" /> {FOUNDER_INFO.instagramHandle}
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs h-10 px-4 rounded-xl"
                >
                  <a href={FOUNDER_INFO.githubUrl} target="_blank" rel="noreferrer">
                    <Github className="w-4 h-4 mr-1.5" /> GitHub Profile
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs h-10 px-4 rounded-xl"
                >
                  <a href={FOUNDER_INFO.linkedinUrl} target="_blank" rel="noreferrer">
                    <Linkedin className="w-4 h-4 mr-1.5 text-sky-400" /> LinkedIn
                  </a>
                </Button>
              </div>
            </div>

            {/* Founder Profile Card */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500 to-violet-600 opacity-30 blur-xl group-hover:opacity-50 transition duration-500" />
              <Card className="relative bg-[#0c1222] border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-950 relative">
                  <img
                    src={FOUNDER_INFO.images.avatarDark}
                    alt={FOUNDER_INFO.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FOUNDER_INFO.images.avatarLight;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-transparent to-transparent" />
                  <Badge className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-bold">
                    🇷🇼 Kigali, Rwanda
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{FOUNDER_INFO.name}</h3>
                    <p className="text-xs text-orange-400 font-medium">{FOUNDER_INFO.title}</p>
                    <p className="text-[11px] text-slate-400">{FOUNDER_INFO.fellowship}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[.07] space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{FOUNDER_INFO.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <a href={`mailto:${FOUNDER_INFO.email}`} className="hover:text-white truncate">
                        {FOUNDER_INFO.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <a href={`tel:${FOUNDER_INFO.phone}`} className="hover:text-white">
                        {FOUNDER_INFO.phone}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 1. AUTO 3D STAGE FOUNDER & INSTAGRAM SHOWCASE */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Auto 3D Stage Founder Gallery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Instagram & Visual Moments
              </h2>
              <p className="text-xs text-slate-400">
                Auto-sliding collection from <a href={FOUNDER_INFO.instagramUrl} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline font-bold">{FOUNDER_INFO.instagramHandle}</a> and personal archives.
              </p>
            </div>

            {/* Filter & Playback Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[.08]">
                {(['all', 'portraits', 'platforms', 'creative'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setMomentCategoryFilter(cat);
                      setActiveMomentIndex(0);
                      setMomentProgress(0);
                    }}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition ${
                      momentCategoryFilter === cat
                        ? 'bg-orange-500 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAutoPlayMoments(!isAutoPlayMoments)}
                  className="h-8 px-2.5 rounded-lg border-white/15 bg-white/[.04] text-xs text-slate-300 hover:text-white"
                  title={isAutoPlayMoments ? 'Pause auto-slide' : 'Resume auto-slide'}
                >
                  {isAutoPlayMoments ? (
                    <>
                      <Pause className="w-3 h-3 mr-1 text-orange-400" /> Auto-Slide: ON
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1 text-slate-400 fill-current" /> Auto-Slide: OFF
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveMomentIndex((prev) => (prev - 1 + filteredMoments.length) % filteredMoments.length);
                    setMomentProgress(0);
                  }}
                  className="h-8 w-8 p-0 rounded-full border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveMomentIndex((prev) => (prev + 1) % filteredMoments.length);
                    setMomentProgress(0);
                  }}
                  className="h-8 w-8 p-0 rounded-full border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-8 px-3 rounded-full shadow-md shadow-pink-600/20"
                >
                  <a href={FOUNDER_INFO.instagramUrl} target="_blank" rel="noreferrer">
                    <Instagram className="w-3.5 h-3.5 mr-1" /> Follow on Instagram
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Auto-Slide Progress Bar */}
          <div className="w-full bg-white/[.06] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${momentProgress}%` }}
            />
          </div>

          {/* 3D Staging Container with Auto-Moving Carousel */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0a0f1d] via-[#060a14] to-[#04060c] border border-white/[.1] p-4 sm:p-8 lg:p-10 shadow-2xl">
            <div className="relative min-h-[400px] sm:min-h-[480px] md:min-h-[520px] flex items-center justify-center [perspective:1600px]">
              {filteredMoments.map((item, idx) => {
                const diff = (idx - (activeMomentIndex % filteredMoments.length) + filteredMoments.length) % filteredMoments.length;
                let transformStyle = '';
                let opacity = 0;
                let zIndex = 0;
                let isCenter = false;

                if (diff === 0) {
                  // Active Center Card (Elevated 3D)
                  transformStyle = 'translate3d(0, 0, 100px) scale(1) rotateY(0deg)';
                  opacity = 1;
                  zIndex = 30;
                  isCenter = true;
                } else if (diff === 1 || (diff === -1 && filteredMoments.length === 2)) {
                  // Right Card
                  transformStyle = 'translate3d(58%, 0, -80px) scale(0.82) rotateY(-20deg)';
                  opacity = 0.6;
                  zIndex = 20;
                } else if (diff === filteredMoments.length - 1) {
                  // Left Card
                  transformStyle = 'translate3d(-58%, 0, -80px) scale(0.82) rotateY(20deg)';
                  opacity = 0.6;
                  zIndex = 20;
                } else {
                  // Background Hidden Cards
                  transformStyle = 'translate3d(0, 0, -180px) scale(0.65)';
                  opacity = 0;
                  zIndex = 10;
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveMomentIndex(idx);
                      setMomentProgress(0);
                    }}
                    className="absolute w-full max-w-[340px] sm:max-w-[460px] md:max-w-[540px] transition-all duration-700 ease-out cursor-pointer select-none"
                    style={{
                      transform: transformStyle,
                      opacity,
                      zIndex,
                    }}
                  >
                    <div
                      className={`relative rounded-3xl overflow-hidden bg-gray-900/95 border transition duration-500 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ${
                        isCenter
                          ? 'border-orange-500/50 ring-1 ring-orange-500/30'
                          : 'border-white/[.12] hover:border-white/30'
                      }`}
                    >
                      {/* Instagram Header Bar */}
                      <div className="p-3.5 bg-black/60 backdrop-blur-md flex items-center justify-between border-b border-white/[.08]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600">
                            <img
                              src={FOUNDER_INFO.images.avatarDark}
                              alt="Gilbert"
                              referrerPolicy="no-referrer"
                              className="w-full h-full rounded-full object-cover border border-black"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FOUNDER_INFO.images.avatarLight;
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-none">tuyambaze.gilbert_</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Kigali, Rwanda</p>
                          </div>
                        </div>

                        <Badge className="bg-orange-500 text-white font-bold text-[9px] px-2 py-0.5">
                          {item.tag}
                        </Badge>
                      </div>

                      {/* Image Frame */}
                      <div className="relative aspect-[16/11] w-full overflow-hidden bg-black group">
                        <img
                          src={item.url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                          onError={(e) => {
                            if (item.fallbackUrl) {
                              (e.target as HTMLImageElement).src = item.fallbackUrl;
                            } else {
                              (e.target as HTMLImageElement).src = FOUNDER_INFO.images.avatarLight;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxMoment(item);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition"
                          aria-label="Enlarge"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Instagram Action & Caption Box */}
                      <div className="p-4 sm:p-5 space-y-2.5 bg-gray-950/95">
                        <div className="flex items-center justify-between text-slate-300">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-pink-500 hover:scale-110 transition"
                              aria-label="Like"
                            >
                              <Heart className="w-5 h-5 fill-current" />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-white transition"
                              aria-label="Comment"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-white transition"
                              aria-label="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>

                          <a
                            href={item.instagramUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                            <span>View on Instagram</span>
                          </a>
                        </div>

                        <p className="text-[11px] font-semibold text-white">
                          Liked by <strong className="text-orange-400 font-bold">{item.likes}</strong> others
                        </p>

                        <div>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            <strong className="text-white font-bold mr-1.5">tuyambaze.gilbert_</strong>
                            {item.caption}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {filteredMoments.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveMomentIndex(i);
                    setMomentProgress(0);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === (activeMomentIndex % filteredMoments.length)
                      ? 'w-10 bg-orange-500 shadow-md shadow-orange-500/50'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Lightbox Modal */}
        {lightboxMoment && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200"
            onClick={() => setLightboxMoment(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-gray-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxMoment(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxMoment.url}
                alt={lightboxMoment.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[65vh] object-contain bg-black"
                onError={(e) => {
                  if (lightboxMoment.fallbackUrl) {
                    (e.target as HTMLImageElement).src = lightboxMoment.fallbackUrl;
                  }
                }}
              />
              <div className="p-5 bg-gray-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">{lightboxMoment.title}</h3>
                  <p className="text-xs text-slate-300 max-w-xl">{lightboxMoment.caption}</p>
                </div>
                <Button asChild size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shrink-0">
                  <a href={lightboxMoment.instagramUrl} target="_blank" rel="noreferrer">
                    <Instagram className="w-3.5 h-3.5 mr-1" /> View on Instagram Profile
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Narrative & The Story Behind OrangeFlix */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-400" />
                The Origin & Mission
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cinema is humanity's most universal language. Yet for years, African cinema—from Rwanda's cinematic gems, Uganda's grassroots Wakaliwood action epics, Kenya's Riverwood narratives, to Nigeria's Nollywood blockbusters and South Africa's film scene—has been scattered across fragmented YouTube channels without a centralized, high-performance home.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">OrangeFlix</strong> was engineered to solve this paradigm. Built from scratch with modern frontend architecture, intelligent rate-limited YouTube indexing, 10-minute multi-tier caching, mood-based AI recommendations, and full multi-country catalog support, OrangeFlix treats independent filmmakers with the same prestige as Hollywood premieres.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-orange-400" />
                Technical Pillars & Engineering Legacy
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
                    <Code2 className="w-4 h-4" /> Real-Time Geo Pipeline
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated YouTube discovery engine that indexes, classifies, and curates multi-part series and full-length movies across 8+ countries.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                    <Cpu className="w-4 h-4" /> Multi-Tier Zero Latency
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    In-memory Map cache synced with localStorage & Firestore to guarantee 0ms instant catalog loading and resilient offline playback.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Globe className="w-4 h-4" /> 3D Staged Cinema UX
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cinema-grade 3D card staging slider on desktop & mobile with dynamic ambient backdrops, skeleton placeholders, and fluid touch carousels.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/[.06] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Monitor className="w-4 h-4" /> Multi-Entity Graph Engine
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unified discovery linking movies to original soundtrack albums, Apple Music previews, behind-the-scenes news, and book adaptations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Skills & Expertise */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gray-900/40 border border-white/[.08] space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-400" />
                Key Expertise & Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {FOUNDER_INFO.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="bg-white/[.03] border-white/10 text-xs text-slate-200 py-1 px-2.5 rounded-lg"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-violet-600/10 border border-orange-500/20 space-y-4 text-center">
              <h3 className="text-base font-bold text-white">Have a Project or Collaboration?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gilbert Tuyambaze is available for full-stack engineering, web design consulting, software partnerships, and creative technology ventures.
              </p>
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 rounded-xl"
              >
                <a href={`mailto:${FOUNDER_INFO.email}`}>
                  <Mail className="w-4 h-4 mr-2" /> Get in Touch
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. AUTO 3D PROJECT SLIDING SHOWCASE (12 COMPLETE PORTFOLIO PROJECTS) */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto 3D Portfolio Showcase ({filteredProjects.length} Projects)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Software Projects & Digital Creations
              </h2>
              <p className="text-xs text-slate-400">
                Continuous auto-sliding project showcase from <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline font-bold">tuyambaze-gilbert.vercel.app</a>
              </p>
            </div>

            {/* Project Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[.08]">
                {(['all', 'fullstack', 'webapps', 'portfolios', 'creative'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setProjectFilter(cat);
                      setActiveProjectIndex(0);
                      setProjectProgress(0);
                    }}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition ${
                      projectFilter === cat
                        ? 'bg-orange-500 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All (12)' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAutoPlayProjects(!isAutoPlayProjects)}
                  className="h-8 px-2.5 rounded-lg border-white/15 bg-white/[.04] text-xs text-slate-300 hover:text-white"
                  title={isAutoPlayProjects ? 'Pause project auto-slide' : 'Resume project auto-slide'}
                >
                  {isAutoPlayProjects ? (
                    <>
                      <Pause className="w-3 h-3 mr-1 text-orange-400" /> Auto-Slide: ON
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1 text-slate-400 fill-current" /> Auto-Slide: OFF
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveProjectIndex((prev) => (prev - 1 + filteredProjects.length) % filteredProjects.length);
                    setProjectProgress(0);
                  }}
                  className="h-8 w-8 p-0 rounded-full border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white"
                  aria-label="Previous project"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveProjectIndex((prev) => (prev + 1) % filteredProjects.length);
                    setProjectProgress(0);
                  }}
                  className="h-8 w-8 p-0 rounded-full border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white"
                  aria-label="Next project"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold h-8 px-3 rounded-full shadow-md shadow-orange-500/20"
                >
                  <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View on Portfolio
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Auto-Slide Project Progress Bar */}
          <div className="w-full bg-white/[.06] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${projectProgress}%` }}
            />
          </div>

          {/* Active Featured 3D Project Highlight Card */}
          <div className="rounded-3xl bg-gradient-to-br from-gray-900/90 via-gray-900/60 to-black/80 border border-orange-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-orange-500/20 border-orange-500/30 text-orange-400 text-xs font-bold">
                    {currentProject.type}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                    {currentProject.highlight}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Project {(activeProjectIndex % filteredProjects.length) + 1} of {filteredProjects.length}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {currentProject.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentProject.description}
                </p>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentProject.stack.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-white/[.06] text-slate-200 text-xs py-1 px-2.5">
                      {t}
                    </Badge>
                  ))}
                </div>

                {/* CTA Links */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Button
                    asChild
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl h-9 px-4 shadow-md shadow-orange-500/20"
                  >
                    <a href={currentProject.liveUrl} target="_blank" rel="noreferrer">
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Live Experience
                    </a>
                  </Button>
                  {currentProject.githubUrl !== '#' && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-white text-xs rounded-xl h-9 px-4"
                    >
                      <a href={currentProject.githubUrl} target="_blank" rel="noreferrer">
                        <Github className="w-3.5 h-3.5 mr-1.5" /> Source / Repository
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Project Snapshot */}
              <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/[.12] shadow-2xl group aspect-[16/10]">
                <img
                  src={currentProject.image}
                  alt={currentProject.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-700"
                  onError={(e) => {
                    if (currentProject.fallbackImage) {
                      (e.target as HTMLImageElement).src = currentProject.fallbackImage;
                    } else {
                      (e.target as HTMLImageElement).src = FOUNDER_INFO.images.preview;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-white truncate max-w-[220px]">{currentProject.title}</span>
                  <span className="text-[10px] text-orange-400 font-mono shrink-0">
                    Project {(activeProjectIndex % filteredProjects.length) + 1} / {filteredProjects.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Sliding Thumbnails Grid with Active Highlight */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-6 pt-6 border-t border-white/[.08]">
              {filteredProjects.map((proj, i) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectIndex(i);
                    setProjectProgress(0);
                  }}
                  className={`p-2.5 rounded-xl text-left transition border ${
                    i === (activeProjectIndex % filteredProjects.length)
                      ? 'bg-orange-500/20 border-orange-500 text-white shadow-lg ring-1 ring-orange-500/50'
                      : 'bg-black/30 border-white/[.06] text-slate-400 hover:text-white hover:border-white/15'
                  }`}
                >
                  <p className="text-[11px] font-bold truncate">{proj.title}</p>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">{proj.type}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. LIVE INTERACTIVE PORTFOLIO EMBED */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-4 border-t border-white/[.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                <Globe className="w-3.5 h-3.5" /> Interactive Portfolio Showcase
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Explore Gilbert Tuyambaze's Full Website
              </h2>
              <p className="text-xs text-slate-400">
                Direct live interactive frame of <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline font-bold">tuyambaze-gilbert.vercel.app</a>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIframeKey((k) => k + 1)}
                className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-slate-200 text-xs h-8 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="border-white/15 bg-white/[.04] hover:bg-white/[.08] text-slate-200 text-xs h-8 rounded-lg"
              >
                <a href={FOUNDER_INFO.portfolioUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open in New Tab
                </a>
              </Button>
            </div>
          </div>

          <div className="relative w-full rounded-3xl border border-white/[.12] overflow-hidden bg-gray-950 shadow-2xl">
            <div className="h-10 bg-gray-900/90 border-b border-white/[.08] px-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-[11px] text-slate-300 ml-2 hidden sm:inline">
                  https://tuyambaze-gilbert.vercel.app/
                </span>
              </div>
              <span className="text-[11px] text-orange-400 font-semibold">Live Interactive Frame</span>
            </div>

            <div className="relative w-full h-[650px] bg-slate-950">
              <iframe
                key={iframeKey}
                src={FOUNDER_INFO.portfolioUrl}
                title="Gilbert Tuyambaze Portfolio"
                className="w-full h-full border-0"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
