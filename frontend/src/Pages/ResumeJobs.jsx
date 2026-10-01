import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  FileUp,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

export default function ResumeJobs() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");

  const validateFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (!["pdf", "doc", "docx"].includes(extension)) {
      setError("Upload a PDF, DOC, or DOCX resume.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Your resume must be smaller than 5 MB.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setJobs([]);
    setAnalyzed(false);
    setKeywords([]);
  };

  const findJobs = async (event) => {
    event?.preventDefault();

    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setJobs([]);
    setAnalyzed(false);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("keyword", query);
      formData.append("location", location);

      const response = await fetch(`${API_URL}/api/resume/match-jobs`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to find matching jobs.",
        );
      }

      if (!Array.isArray(data.jobs)) {
        throw new Error(
          "The jobs API must return a jobs array. Check your backend response.",
        );
      }

      setJobs(data.jobs);
      setKeywords(
        Array.isArray(data.extractedSkills)
          ? data.extractedSkills
          : Array.isArray(data.skills)
            ? data.skills
            : [],
      );
      setAnalyzed(true);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the job matching service. Check your backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setFile(null);
    setJobs([]);
    setKeywords([]);
    setAnalyzed(false);
    setError("");
    setQuery("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const getMatchScore = (job) => {
    const score = Number(job.matchScore ?? job.matchPercentage);
    return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
  };

  const getApplyLink = (job) => job.applyUrl || job.applicationUrl || job.url;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-neutral-950">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <BriefcaseBusiness size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Career<span className="text-neutral-500">Hub</span>.
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-neutral-600 md:flex">
            <Link to="/" className="hover:text-black">
              Home
            </Link>
            <Link to="/jobs" className="hover:text-black">
              All Jobs
            </Link>
            <Link to="/resume-optimizer" className="hover:text-black">
              Resume ATS
            </Link>
          </nav>

          <Link
            to="/signup"
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to CareerHub
        </Link>

        {/* Page heading */}
        <section className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800">
            <Sparkles size={14} />
            AI JOB DISCOVERY
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Your resume.
            <span className="block text-neutral-400">
              Your next opportunity.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Upload your resume to discover relevant roles based on your skills,
            experience, and preferred location.
          </p>
        </section>

        {/* Search form */}
        <form
          onSubmit={findJobs}
          className="mt-9 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            {/* Resume upload */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Your resume
              </label>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  validateFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  validateFile(event.dataTransfer.files?.[0]);
                }}
                className={`flex min-h-[54px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  dragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-300 hover:border-neutral-500"
                }`}
              >
                <FileUp size={20} className="shrink-0 text-neutral-500" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file ? file.name : "Upload PDF or DOCX"}
                </span>
                {file && (
                  <CheckCircle2 size={17} className="shrink-0 text-green-600" />
                )}
              </button>
              <p className="mt-2 text-xs text-neutral-500">
                PDF, DOC, DOCX · Maximum 5 MB
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label
                htmlFor="job-keyword"
                className="mb-2 block text-sm font-medium"
              >
                Target role or keyword
              </label>
              <div className="flex h-[54px] items-center gap-2 rounded-xl border border-neutral-300 px-3 focus-within:border-neutral-500">
                <Search size={18} className="shrink-0 text-neutral-400" />
                <input
                  id="job-keyword"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. React Developer"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="job-location"
                className="mb-2 block text-sm font-medium"
              >
                Preferred location
              </label>
              <div className="flex h-[54px] items-center gap-2 rounded-xl border border-neutral-300 px-3 focus-within:border-neutral-500">
                <MapPin size={18} className="shrink-0 text-neutral-400" />
                <input
                  id="job-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Hyderabad, India"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="flex h-[54px] items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {loading ? "Searching..." : "Find Jobs"}
            </button>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-600">
                <FileText size={17} className="shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>

              <button
                type="button"
                onClick={resetSearch}
                className="flex shrink-0 items-center gap-1 text-xs text-neutral-500 hover:text-black"
              >
                <X size={15} />
                Clear
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Skills extracted from resume */}
        {keywords.length > 0 && (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">Skills identified in your resume</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Results header */}
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Job recommendations
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {analyzed
                  ? `${jobs.length} matching job${jobs.length === 1 ? "" : "s"}`
                  : "Find roles that fit your skills"}
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                {analyzed
                  ? "Recommendations returned by your job matching service."
                  : "Upload your resume to generate personalized recommendations."}
              </p>
            </div>

            {analyzed && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                <CheckCircle2 size={15} />
                Analysis complete
              </span>
            )}
          </div>

          {loading && (
            <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white">
              <LoaderCircle size={35} className="animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-medium">
                Finding jobs for your profile...
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Matching resume details against available job listings.
              </p>
            </div>
          )}

          {!loading && !analyzed && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Skills-based matching",
                  text: "Identify roles that align with your experience.",
                },
                {
                  icon: Building2,
                  title: "Company discovery",
                  text: "Review employers and their open positions.",
                },
                {
                  icon: BriefcaseBusiness,
                  title: "Application links",
                  text: "Continue to the available application page.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-neutral-200 bg-white p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-500">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && analyzed && jobs.length === 0 && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
              <Search size={30} className="mx-auto text-neutral-400" />
              <h3 className="mt-4 font-semibold">No matching jobs returned</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Try a different role or location, or check whether your backend
                has active job listings.
              </p>
            </div>
          )}

          {!loading && analyzed && jobs.length > 0 && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {jobs.map((job, index) => {
                const matchScore = getMatchScore(job);
                const skills = Array.isArray(job.skills)
                  ? job.skills
                  : Array.isArray(job.requiredSkills)
                    ? job.requiredSkills
                    : [];
                const applyLink = getApplyLink(job);

                return (
                  <article
                    key={job._id || job.id || `${job.title}-${index}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 hover:shadow-lg sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                        <Building2 size={22} className="text-neutral-700" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold leading-snug">
                          {job.title || job.jobTitle || "Untitled position"}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-600">
                          {job.company ||
                            job.companyName ||
                            "Company not provided"}
                        </p>
                      </div>

                      {matchScore !== null && (
                        <div className="shrink-0 rounded-xl bg-green-50 px-3 py-2 text-center">
                          <p className="text-lg font-bold text-green-700">
                            {matchScore}%
                          </p>
                          <p className="text-[10px] text-green-700">MATCH</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {job.location || location || "Location not specified"}
                      </span>

                      {(job.jobType || job.employmentType) && (
                        <span className="flex items-center gap-1.5">
                          <BriefcaseBusiness size={14} />
                          {job.jobType || job.employmentType}
                        </span>
                      )}

                      {job.experience && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {job.experience}
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-600">
                        {job.description}
                      </p>
                    )}

                    {skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-neutral-700">
                          Relevant skills
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {skills.slice(0, 6).map((skill, skillIndex) => (
                            <span
                              key={`${skill}-${skillIndex}`}
                              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.matchReason && (
                      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
                        <span className="font-semibold text-neutral-800">
                          Why this matches:{" "}
                        </span>
                        {job.matchReason}
                      </div>
                    )}

                    <div className="mt-5 border-t border-neutral-100 pt-4">
                      {applyLink ? (
                        <a
                          href={applyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                          View / Apply
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500"
                        >
                          Application link unavailable
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-semibold">
                Want to improve your resume first?
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Check your resume structure and keywords before applying.
              </p>
              <Link
                to="/resume-optimizer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-blue-700"
              >
                Open Resume ATS Optimizer
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
