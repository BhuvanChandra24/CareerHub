import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock3,
  ArrowUpRight,
  X,
  Upload,
  FileText,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com";

function cleanText(value) {
  if (value == null) return "";
  if (typeof value !== "string") return String(value);
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "External job board";
  }
}

function normalizeJob(raw, index) {
  const locationValue =
    raw.location ??
    raw.job_location ??
    raw.location_name ??
    raw.city ??
    "Location not specified";
  const location =
    typeof locationValue === "string"
      ? locationValue
      : [
          locationValue.city,
          locationValue.state,
          locationValue.country,
          locationValue.display_name,
        ]
          .filter(Boolean)
          .join(", ") || "Location not specified";
  const title = cleanText(
    raw.role ?? raw.title ?? raw.job_title ?? raw.position ?? raw.name,
  );
  const company = cleanText(
    raw.company ??
      raw.company_name ??
      raw.employer_name ??
      raw.organization ??
      raw.employer ??
      "Company not specified",
  );
  const applyUrl =
    raw.applyUrl ??
    raw.apply_url ??
    raw.job_url ??
    raw.redirect_url ??
    raw.url ??
    raw.link ??
    "";
  const rawSkills = raw.skills ?? raw.tags ?? raw.requirements ?? [];
  const skills = Array.isArray(rawSkills)
    ? rawSkills
        .map((item) =>
          cleanText(
            typeof item === "string" ? item : (item?.name ?? item?.label),
          ),
        )
        .filter(Boolean)
    : typeof rawSkills === "string"
      ? rawSkills
          .split(/[,|]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  const rawType = cleanText(
    raw.type ?? raw.job_type ?? raw.employment_type ?? raw.employmentType ?? "",
  );
  const type = /intern/i.test(rawType)
    ? "Internship"
    : /contract|temporary|freelance/i.test(rawType)
      ? "Contract"
      : /part.?time/i.test(rawType)
        ? "Part-time"
        : /full.?time/i.test(rawType)
          ? "Full-time"
          : rawType || "Not specified";
  const postedAt =
    raw.postedAt ??
    raw.posted_at ??
    raw.date_posted ??
    raw.created_at ??
    raw.published_at ??
    "";
  const source = cleanText(
    raw.source ??
      raw.provider ??
      raw.job_board ??
      raw.board ??
      (applyUrl ? getHostname(applyUrl) : "CareerHub source"),
  );
  const description = cleanText(
    raw.description ??
      raw.job_description ??
      raw.summary ??
      "No description provided by the source.",
  );
  const id =
    raw.id ??
    raw.job_id ??
    raw.slug ??
    applyUrl ??
    `${company}-${title}-${index}`;

  return {
    id: String(id),
    company: company || "Company not specified",
    role: title || "Untitled role",
    location,
    type,
    experience: cleanText(
      raw.experience ??
        raw.experience_level ??
        raw.seniority ??
        "Not specified",
    ),
    category: cleanText(
      raw.category?.name ??
        raw.category ??
        raw.job_category ??
        raw.department ??
        "Other",
    ),
    description,
    skills,
    source,
    applyUrl,
    postedAt,
  };
}

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  experience: "",
  linkedin: "",
  portfolio: "",
  coverLetter: "",
};

export default function Jobs() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
          sessionStorage.getItem("user") ||
          "null",
      );
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
    navigate("/");
  };
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [category, setCategory] = useState("All categories");
  const [jobType, setJobType] = useState("All types");
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchJobs = useCallback(async (signal) => {
    setLoadingJobs(true);
    setJobsError("");
    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Jobs service returned HTTP ${response.status}.`,
        );
      }
      const rawJobs = Array.isArray(data)
        ? data
        : (data.jobs ?? data.results ?? data.data ?? []);
      if (!Array.isArray(rawJobs))
        throw new Error("The jobs API response must contain an array of jobs.");
      const normalized = rawJobs
        .map(normalizeJob)
        .filter((job) => job.role && job.role !== "Untitled role");
      const uniqueJobs = [];
      const seen = new Set();
      for (const job of normalized) {
        const key = (
          job.applyUrl || `${job.company}|${job.role}|${job.location}`
        ).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueJobs.push(job);
        }
      }
      setJobs(uniqueJobs);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.name !== "AbortError") {
        setJobsError(
          err.message ||
            "Unable to fetch jobs. Check that the CareerHub jobs API is running.",
        );
        setJobs([]);
      }
    } finally {
      if (!signal?.aborted) setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal);
    return () => controller.abort();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesSearch =
        !q ||
        job.role.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q));

      const matchesLocation =
        location === "All locations" ||
        job.location.toLowerCase().includes(location.toLowerCase());

      const matchesCategory =
        category === "All categories" || job.category === category;

      const matchesType = jobType === "All types" || job.type === jobType;

      return matchesSearch && matchesLocation && matchesCategory && matchesType;
    });
  }, [jobs, search, location, category, jobType]);

  const openApplication = (job) => {
    setSelectedJob(job);
    setForm(initialForm);
    setResume(null);
    setError("");
    setSuccess("");
  };

  const closeApplication = () => {
    if (submitting) return;
    setSelectedJob(null);
    setError("");
    setSuccess("");
  };

  const updateForm = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleResume = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.type)) {
      setResume(null);
      setError("Upload your resume as a PDF, DOC, or DOCX file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResume(null);
      setError("Your resume must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setResume(file);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedJob) return;

    if (!resume) {
      setError("Please upload your resume before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const body = new FormData();

      body.append("jobId", String(selectedJob.id));
      body.append("company", selectedJob.company);
      body.append("jobTitle", selectedJob.role);
      body.append("fullName", form.fullName.trim());
      body.append("email", form.email.trim());
      body.append("phone", form.phone.trim());
      body.append("experience", form.experience);
      body.append("linkedin", form.linkedin.trim());
      body.append("portfolio", form.portfolio.trim());
      body.append("coverLetter", form.coverLetter.trim());
      body.append("resume", resume);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/applications`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Application could not be submitted. Check your backend API.",
        );
      }

      setSuccess("Application submitted successfully!");

      setTimeout(() => {
        setSelectedJob(null);
        setSuccess("");
      }, 1400);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the application server. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="min-h-screen bg-[#f8f9fb] text-neutral-950">
      {/* Header */}

      {/* Hero */}
      <section className="relative overflow-hidden bg-black px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-36 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-neutral-300">
            <Sparkles size={14} />
            Your next opportunity starts here
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Find work that moves
            <span className="block text-neutral-400">your career forward.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
            Explore opportunities, discover companies, and apply with your
            resume from one simple workspace.
          </p>

          <div className="mt-9 flex flex-wrap gap-6 text-sm text-neutral-300">
            <span className="flex items-center gap-2">
              <Building2 size={17} />
              {jobs.length} live listings
            </span>
            <span className="flex items-center gap-2">
              <FileText size={17} />
              Resume-based applications
            </span>
          </div>
        </div>
      </section>

      {/* Job search */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Job title, company, or skill"
                aria-label="Search jobs"
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by location"
              className={inputClass}
            >
              <option>All locations</option>
              <option>Hyderabad</option>
              <option>Bengaluru</option>
              <option>Chennai</option>
              <option>Noida</option>
              <option>Mysuru</option>
              <option>Pune</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className={inputClass}
            >
              <option>All categories</option>
              {[
                ...new Set(jobs.map((job) => job.category).filter(Boolean)),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              aria-label="Filter by employment type"
              className={inputClass}
            >
              <option>All types</option>
              <option>Full-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>
        </div>

        {/* Results heading */}
        <div className="mb-5 mt-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Explore opportunities
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Showing {filteredJobs.length} of {jobs.length} live listings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-neutral-400">
                Updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchJobs()}
              disabled={loadingJobs}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={loadingJobs ? "animate-spin" : ""}
              />
              {loadingJobs ? "Refreshing..." : "Refresh jobs"}
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <SlidersHorizontal size={15} /> Filter your search
            </div>
          </div>
        </div>

        {/* Job cards */}
        {loadingJobs && jobs.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
            <RefreshCw
              className="mx-auto animate-spin text-blue-600"
              size={30}
            />
            <h3 className="mt-4 text-lg font-semibold">Fetching live jobs</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Connecting to the CareerHub jobs service...
            </p>
          </div>
        ) : jobsError && jobs.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <AlertCircle className="mx-auto text-red-600" size={30} />
            <h3 className="mt-4 text-lg font-semibold text-red-900">
              Could not load live jobs
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-red-800">
              {jobsError}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-red-700">
              Expected endpoint: {API_URL}/api/jobs. Connect an authorized
              job-data provider in your backend; this page does not substitute
              sample vacancies.
            </p>
            <button
              type="button"
              onClick={() => fetchJobs()}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm text-white"
            >
              Try again
            </button>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:shadow-xl hover:shadow-neutral-200/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-bold text-neutral-800">
                    {job.company
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 3)}
                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    {job.type}
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium text-neutral-500">
                  {job.company}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                    Source: {job.source}
                  </span>
                  {job.postedAt && (
                    <span>
                      Posted{" "}
                      {Number.isNaN(Date.parse(job.postedAt))
                        ? cleanText(job.postedAt)
                        : new Date(job.postedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {job.role}
                </h3>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} />
                    {job.experience}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-sm leading-6 text-neutral-600">
                  {job.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {job.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Apply on source <ExternalLink size={15} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openApplication(job)}
                      className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Submit via CareerHub <ArrowUpRight size={16} />
                    </button>
                  )}
                  <span className="text-xs text-neutral-400">
                    Live source listing
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <Search className="mx-auto text-neutral-400" size={30} />
            <h3 className="mt-4 text-lg font-semibold">No matching jobs</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {jobs.length === 0
                ? "No live listings were returned by the connected providers."
                : "Try another search term or clear your filters."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocation("All locations");
                setCategory("All categories");
                setJobType("All types");
              }}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Application modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeApplication();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-heading"
            className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                  CareerHub application
                </p>
                <h2
                  id="application-heading"
                  className="mt-1 text-xl font-semibold"
                >
                  Apply for {selectedJob.role}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {selectedJob.company} · {selectedJob.location}
                </p>
              </div>

              <button
                type="button"
                onClick={closeApplication}
                disabled={submitting}
                aria-label="Close application form"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitApplication} className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full name *
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={updateForm}
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email address *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateForm}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone number *
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateForm}
                    required
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Experience *
                  </label>
                  <select
                    name="experience"
                    value={form.experience}
                    onChange={updateForm}
                    required
                    className={inputClass}
                  >
                    <option value="">Select experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1–2 years">1–2 years</option>
                    <option value="3–5 years">3–5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    LinkedIn profile
                  </label>
                  <input
                    name="linkedin"
                    type="url"
                    value={form.linkedin}
                    onChange={updateForm}
                    placeholder="https://linkedin.com/in/..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Portfolio / GitHub
                  </label>
                  <input
                    name="portfolio"
                    type="url"
                    value={form.portfolio}
                    onChange={updateForm}
                    placeholder="https://github.com/..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Resume upload */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Upload resume *
                </label>

                <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  {resume ? (
                    <CheckCircle2 size={28} className="text-green-600" />
                  ) : (
                    <Upload size={28} className="text-neutral-500" />
                  )}

                  <span className="mt-3 text-sm font-medium">
                    {resume ? resume.name : "Choose your resume"}
                  </span>

                  <span className="mt-1 text-xs text-neutral-500">
                    PDF, DOC, or DOCX · Maximum 5 MB
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required={!resume}
                    onChange={handleResume}
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cover letter
                </label>
                <textarea
                  name="coverLetter"
                  value={form.coverLetter}
                  onChange={updateForm}
                  rows={4}
                  maxLength={4000}
                  placeholder="Tell the employer why you're a good fit for this role..."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-neutral-400">
                  {form.coverLetter.length}/4000
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700"
                >
                  <CheckCircle2 size={18} />
                  {success}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeApplication}
                  disabled={submitting}
                  className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || Boolean(success)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                  {!submitting && <ArrowUpRight size={17} />}
                </button>
              </div>

              <p className="text-xs leading-5 text-neutral-400">
                This form sends your details to the CareerHub backend. For jobs
                with an original listing link, use “Apply on source” to apply
                directly through the employer or job board.
              </p>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
