import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import careerHubLogo from "../assets/careerhub.png"; // Update filename if your asset uses a different name
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  BriefcaseBusiness,
  Sparkles,
  FileText,
  Target,
  MessageSquare,
  ChartNoAxesCombined,
  BookOpen,
  CheckCircle2,
  Search,
  Layers3,
  ChevronRight,
  Bot,
  Zap,
  Compass,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Job Discovery",
    description:
      "Explore opportunities that match your skills, interests, and career goals.",
    number: "01",
  },
  {
    icon: FileText,
    title: "Resume Intelligence",
    description:
      "Improve your resume with actionable feedback, skill insights, and suggestions.",
    number: "02",
  },
  {
    icon: Target,
    title: "AI Job Matching",
    description:
      "Understand how your skills align with job requirements and identify gaps.",
    number: "03",
  },
  {
    icon: MessageSquare,
    title: "Interview Preparation",
    description:
      "Practice interview questions and build confidence before the real interview.",
    number: "04",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Application Tracking",
    description:
      "Keep your applications organized and follow your progress in one workspace.",
    number: "05",
  },
  {
    icon: BookOpen,
    title: "Career Roadmap",
    description:
      "Discover relevant skills and learning resources for your next career move.",
    number: "06",
  },
];

const tools = [
  {
    icon: FileText,
    id: "resume",
    title: "Resume Analyzer",
    description:
      "Get feedback on your resume structure, skills, and relevance to your target role.",
    tag: "RESUME",
  },
  {
    icon: Bot,
    id: "career",
    title: "AI Career Assistant",
    description:
      "Explore career options, prepare application materials, and identify next steps.",
    tag: "CAREER AI",
  },
  {
    icon: MessageSquare,
    id: "interview",
    title: "Mock Interviews",
    description:
      "Practice technical and behavioral questions with a structured preparation workflow.",
    tag: "PRACTICE",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const user =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      return token && user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setCurrentUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  // Send authenticated users to their dashboard; only new/signed-out users see signup.
  const handleStartJourney = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    navigate(token ? "/dashboard" : "/signup");
  };

  const handleAIToolClick = (toolId) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const isSignedIn = Boolean(token && storedUser);
    const target = `/ai-tools?tool=${encodeURIComponent(toolId)}`;

    setMenuOpen(false);
    if (isSignedIn) {
      navigate(target);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
    }
  };

  const goToSection = (id) => {
    setMenuOpen(false);

    if (id === "jobs") {
      navigate("/jobs");
      return;
    }

    if (id === "home") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Features has been removed from the header navigation.
  // The Features section itself remains on the landing page.
  const navItems = [
    { label: "Home", id: "home" },
    { label: "Jobs", id: "jobs" },
    { label: "AI Tools", id: "ai-tools" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-950">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-center whitespace-nowrap"
            aria-label="CareerHub home"
          >
            <img
              src={careerHubLogo}
              alt="CareerHub logo"
              className="h-10 w-auto max-w-[210px] object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) =>
              item.id === "jobs" ? (
                <Link
                  key={item.id}
                  to="/jobs"
                  className="text-sm font-medium text-neutral-600 transition hover:text-black"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className="text-sm font-medium text-neutral-600 transition hover:text-black"
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {(
                      currentUser.fullName ||
                      currentUser.name ||
                      currentUser.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <span>
                    {currentUser.fullName || currentUser.name || "My Profile"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm font-medium text-neutral-600 hover:text-black"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-neutral-700 transition hover:text-black"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Get Started{" "}
                  <ArrowUpRight
                    size={16}
                    className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 md:hidden"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-neutral-200 bg-white px-5 py-5 shadow-lg md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) =>
                item.id === "jobs" ? (
                  <Link
                    key={item.id}
                    to="/jobs"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSection(item.id)}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    {item.label}
                  </button>
                ),
              )}

              <div className="my-3 border-t border-neutral-200" />
              {currentUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    My Profile ·{" "}
                    {currentUser.fullName ||
                      currentUser.name ||
                      currentUser.email}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative scroll-mt-24 overflow-hidden bg-white"
      >
        <div className="pointer-events-none absolute -right-40 -top-20 h-[480px] w-[480px] rounded-full bg-neutral-100 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-60 h-[400px] w-[400px] rounded-full bg-blue-50/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-10 lg:py-32">
          {/* Hero Content */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm">
              <Sparkles size={15} className="text-blue-600" />
              Your career journey, reimagined
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>

            <h1 className="max-w-2xl text-[43px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-[72px]">
              Make your next move.
              <span className="mt-2 block text-neutral-400">
                Make it count.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-neutral-600 sm:text-lg">
              Discover opportunities, refine your resume, prepare for
              interviews, and track your applications — all in one place.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleStartJourney}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Start Your Journey
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-4 text-sm font-medium text-neutral-900 transition hover:border-neutral-500 hover:bg-neutral-50"
              >
                Explore Jobs
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-neutral-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-neutral-800" />
                One career workspace
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-neutral-800" />
                AI-powered preparation
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto w-full max-w-[530px]">
            <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-neutral-100 via-white to-blue-50 blur-xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-4 shadow-2xl shadow-neutral-200/70 sm:p-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
                <div>
                  <p className="text-xs text-neutral-500">YOUR WORKSPACE</p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Career overview
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <ChartNoAxesCombined size={20} />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-neutral-950 p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-400">
                      YOUR NEXT OPPORTUNITY
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      Build your future.
                    </h3>
                    <p className="mt-2 max-w-[240px] text-sm leading-6 text-neutral-400">
                      Keep your goals, applications, and preparation connected.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Compass size={23} />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-white/15">
                    <div className="h-1.5 w-3/5 rounded-full bg-white" />
                  </div>
                  <span className="text-xs text-neutral-300">
                    Keep progressing
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <p className="mt-4 text-sm font-semibold">Discover jobs</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Find roles that fit your goals.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <Sparkles size={18} />
                  </div>
                  <p className="mt-4 text-sm font-semibold">Use AI tools</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Prepare for your next step.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <Layers3 size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Your career, organized
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Applications, skills, and learning in one place.
                  </p>
                </div>

                <ArrowUpRight size={18} className="shrink-0 text-neutral-500" />
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">Take the next step</p>
                <p className="mt-1 text-xs text-neutral-500">
                  One goal at a time
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTRO STRIP ================= */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p className="text-sm font-medium text-neutral-700">
            Everything you need to move your career forward.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-neutral-500">
            <span>Discover</span>
            <span>Prepare</span>
            <span>Apply</span>
            <span>Improve</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Built around you
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Your career toolkit.
                <span className="block text-neutral-400">
                  All in one place.
                </span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
              From your first job search to interview preparation, bring your
              career workflow together in one focused workspace.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.number}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:shadow-xl hover:shadow-neutral-100 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 transition group-hover:bg-black group-hover:text-white">
                      <Icon size={22} strokeWidth={1.7} />
                    </div>

                    <span className="text-xs text-neutral-400">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-neutral-800">
                    Discover more
                    <ChevronRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= AI TOOLS ================= */}
      <section
        id="ai-tools"
        className="scroll-mt-24 border-y border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <Sparkles size={23} />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Work smarter
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Meet your AI career toolkit.
            </h2>

            <p className="mt-5 text-sm leading-7 text-neutral-600 sm:text-base">
              Prepare with purpose using tools designed to help you understand
              your skills and approach your next opportunity with confidence.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <article
                  key={tool.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 hover:shadow-lg sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                      <Icon size={23} />
                    </div>

                    <span className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-semibold tracking-wider text-neutral-500">
                      {tool.tag}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-semibold">{tool.title}</h3>

                  <p className="mt-3 min-h-[72px] text-sm leading-7 text-neutral-600">
                    {tool.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleAIToolClick(tool.id)}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-blue-700"
                  >
                    Get started
                    <ArrowUpRight size={16} />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img
                  src={careerHubLogo}
                  alt="CareerHub logo"
                  className="h-9 w-9 rounded-lg object-contain"
                />

                <span className="text-xl font-bold tracking-tight">
                  Career<span className="text-neutral-500">Hub</span>
                  <span className="text-blue-600">.</span>
                </span>
              </Link>

              <p className="mt-3 text-sm text-neutral-500">
                Where your next begins.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-600">
              <button
                type="button"
                onClick={() => goToSection("home")}
                className="hover:text-black"
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => goToSection("features")}
                className="hover:text-black"
              >
                Features
              </button>

              <Link to="/jobs" className="hover:text-black">
                Jobs
              </Link>

              <button
                type="button"
                onClick={() => goToSection("ai-tools")}
                className="hover:text-black"
              >
                AI Tools
              </button>

              <Link to="/login" className="hover:text-black">
                Login
              </Link>
            </nav>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} CareerHub. All rights reserved.</p>

            <p>Built to help you take your next step.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
