import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  UserRound,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import "./AIToolkit.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqx.onrender.com/"
).replace(/\/$/, "");
const tools = [
  {
    id: "resume",
    tag: "RESUME AI",
    icon: FileText,
    title: "Resume AI",
    description:
      "Review resume strengths, gaps and bullet points, with or without a target job description.",
  },
  {
    id: "job-match",
    tag: "JOB MATCHING",
    icon: Target,
    title: "AI Job Matching",
    description:
      "Compare your resume skills against live jobs returned by your configured job providers.",
  },
  {
    id: "cover-letter",
    tag: "APPLICATIONS",
    icon: BriefcaseBusiness,
    title: "Cover Letters",
    description:
      "Create a role-specific cover letter grounded in the resume details you provide.",
  },
  {
    id: "linkedin",
    tag: "PERSONAL BRAND",
    icon: UserRound,
    title: "LinkedIn AI",
    description:
      "Draft a truthful LinkedIn headline, About section, profile summary or connection message.",
  },
  {
    id: "interview",
    tag: "PRACTICE",
    icon: MessageSquare,
    title: "Interview AI",
    description:
      "Generate role-specific interview questions and get structured feedback on your answers.",
  },
  {
    id: "career",
    tag: "CAREER AI",
    icon: Sparkles,
    title: "AI Career Assistant",
    description:
      "Get actionable guidance for career planning, applications and interview preparation.",
  },
];
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

export default function AIToolkit() {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedTool = new URLSearchParams(location.search).get("tool");
  const [activeTool, setActiveTool] = useState(() =>
    tools.some(
      (tool) => tool.id === requestedTool && tool.id !== "cover-letter",
    )
      ? requestedTool
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [resultJobs, setResultJobs] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("Frontend Developer");
  const [level, setLevel] = useState("Fresher");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [brandingTool, setBrandingTool] = useState("LinkedIn About section");
  const [brandingDetails, setBrandingDetails] = useState("");
  const [keyword, setKeyword] = useState("");
  const [jobLocation, setJobLocation] = useState("India");

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  };
  const openTool = (id) => {
    if (id === "cover-letter") {
      navigate("/cover-letter");
      return;
    }
    navigate(`/ai-tools?tool=${encodeURIComponent(id)}`);
    setActiveTool(id);
    setBusy(false);
    setError("");
    setResult("");
    setResultJobs([]);
    setQuestions([]);
    setQuestionIndex(0);
    setAnswer("");
  };
  const backToTools = () => {
    setActiveTool(null);
    setError("");
    setResult("");
    setResultJobs([]);
    navigate("/ai-tools", { replace: true });
  };
  async function analyzeResume(event) {
    event.preventDefault();
    if (!resumeFile) return setError("Choose a PDF or DOCX resume first.");
    setBusy(true);
    setError("");
    setResult("");
    try {
      const form = new FormData();
      form.append("resume", resumeFile);
      form.append("jobDescription", jobDescription);
      const data = await request("/api/ai/resume/analyze", {
        method: "POST",
        body: form,
      });
      setResult(data.result || "No analysis was returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function matchJobs(event) {
    event.preventDefault();
    if (!resumeFile) return setError("Choose a PDF or DOCX resume first.");
    setBusy(true);
    setError("");
    setResultJobs([]);
    setResult("");
    try {
      const form = new FormData();
      form.append("resume", resumeFile);
      form.append("keyword", keyword);
      form.append("location", jobLocation);
      const data = await request("/api/resume/match-jobs", {
        method: "POST",
        body: form,
      });
      setResultJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setResult(
        `Skills found in your resume: ${(data.extractedSkills || []).join(", ") || "No recognized skills were found."}`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function askAssistant(event) {
    event.preventDefault();
    if (!message.trim()) return setError("Enter a question or career goal.");
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await request("/api/ai/career-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          context: { targetRole: role, level },
        }),
      });
      setResult(data.result || "No response was returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function generateQuestions(event) {
    event.preventDefault();
    if (!role.trim()) return setError("Enter an interview role.");
    setBusy(true);
    setError("");
    setResult("");
    setQuestions([]);
    try {
      const data = await request("/api/ai/mock-interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, count: Number(count) }),
      });
      const list = Array.isArray(data.questions) ? data.questions : [];
      if (!list.length)
        throw new Error(
          "The AI returned no interview questions. Please try again.",
        );
      setQuestions(list);
      setQuestionIndex(0);
      setAnswer("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function evaluateAnswer(event) {
    event.preventDefault();
    const question = questions[questionIndex];
    if (!answer.trim())
      return setError("Write your answer before requesting feedback.");
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await request("/api/ai/mock-interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          level,
          question: question.question || question,
          answer: answer.trim(),
        }),
      });
      setResult(data.result || "No feedback was returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function generateBranding(event) {
    event.preventDefault();
    if (!brandingDetails.trim())
      return setError(
        "Add your real skills, projects and experience so the draft can stay accurate.",
      );
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await request("/api/ai/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: brandingTool,
          details: brandingDetails.trim(),
        }),
      });
      setResult(data.result || "No content was returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ai-toolkit">
      <section className="ai-toolkit__hero">
        <span className="ai-toolkit__eyebrow">CAREERHUB · AI TOOLS</span>
        <h1>AI tools for every career move.</h1>
        <p>
          Analyze your resume, match real jobs, write application materials,
          build your professional brand and practice interviews. Results depend
          on your configured AI and job-provider APIs.
        </p>
      </section>
      {!activeTool ? (
        <section className="ai-toolkit__grid" aria-label="AI career tools">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <article className="ai-tool-card" key={tool.id}>
                <div className="ai-tool-card__top">
                  <span className="ai-tool-card__icon" aria-hidden="true">
                    <Icon size={25} />
                  </span>
                  <span className="ai-tool-card__tag">{tool.tag}</span>
                </div>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
                <button
                  className="ai-tool-card__link"
                  onClick={() => openTool(tool.id)}
                >
                  Open tool <span aria-hidden="true">↗</span>
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="ai-workspace">
          <div className="ai-workspace__heading">
            <button className="ai-back" onClick={backToTools}>
              ← All AI tools
            </button>
            <h2>{tools.find((tool) => tool.id === activeTool)?.title}</h2>
            <p>
              AI-generated drafts are suggestions, not guarantees. Review
              results before using them in an application.
            </p>
          </div>
          {activeTool === "resume" && (
            <form className="ai-form" onSubmit={analyzeResume}>
              <label>
                Resume file (PDF or DOCX)
                <input
                  required
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              <label>
                Target job description{" "}
                <span className="ai-optional">Optional</span>
                <textarea
                  rows="5"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to compare your resume…"
                />
              </label>
              <button className="ai-primary" disabled={busy}>
                {busy ? "Analyzing resume…" : "Analyze resume"}
              </button>
            </form>
          )}
          {activeTool === "job-match" && (
            <form className="ai-form" onSubmit={matchJobs}>
              <label>
                Resume file (PDF or DOCX)
                <input
                  required
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </label>
              <div className="ai-form__row">
                <label>
                  Target role or keyword
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. React Developer"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="India"
                  />
                </label>
              </div>
              <button className="ai-primary" disabled={busy}>
                {busy ? "Matching your resume…" : "Find matching jobs"}
              </button>
              <p className="ai-optional">
                Requires a working Adzuna or Jooble API key in the backend
                environment. No sample jobs are inserted.
              </p>
            </form>
          )}
          {activeTool === "career" && (
            <form className="ai-form" onSubmit={askAssistant}>
              <div className="ai-form__row">
                <label>
                  Target role
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. MERN Stack Developer"
                  />
                </label>
                <label>
                  Experience level
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option>Fresher</option>
                    <option>Intern</option>
                    <option>0–2 years</option>
                    <option>3–5 years</option>
                    <option>Experienced</option>
                  </select>
                </label>
              </div>
              <label>
                What would you like help with?
                <textarea
                  required
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Build a 6-week React interview preparation plan…"
                />
              </label>
              <button className="ai-primary" disabled={busy}>
                {busy ? "Thinking…" : "Ask CareerHub AI"}
              </button>
            </form>
          )}
          {activeTool === "linkedin" && (
            <form className="ai-form" onSubmit={generateBranding}>
              <label>
                Content type
                <select
                  value={brandingTool}
                  onChange={(e) => setBrandingTool(e.target.value)}
                >
                  <option>LinkedIn headline</option>
                  <option>LinkedIn About section</option>
                  <option>LinkedIn profile summary</option>
                  <option>Connection request message</option>
                  <option>Professional bio</option>
                </select>
              </label>
              <label>
                Your real skills, projects, education and goals
                <textarea
                  required
                  rows="7"
                  value={brandingDetails}
                  onChange={(e) => setBrandingDetails(e.target.value)}
                  placeholder="Add only details that are true about you. The AI will not invent experience or credentials."
                />
              </label>
              <button className="ai-primary" disabled={busy}>
                {busy ? "Drafting…" : "Generate professional content"}
              </button>
            </form>
          )}
          {activeTool === "interview" && (
            <div className="ai-form">
              <form onSubmit={generateQuestions}>
                <div className="ai-form__row">
                  <label>
                    Interview role
                    <input
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. React Developer"
                    />
                  </label>
                  <label>
                    Level
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option>Fresher</option>
                      <option>Intern</option>
                      <option>Junior</option>
                      <option>Mid-level</option>
                      <option>Senior</option>
                    </select>
                  </label>
                  <label>
                    Questions
                    <select
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                    >
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                    </select>
                  </label>
                </div>
                <button className="ai-primary" disabled={busy}>
                  {busy
                    ? "Preparing questions…"
                    : "Generate interview questions"}
                </button>
              </form>
              {questions.length > 0 && (
                <form className="ai-question" onSubmit={evaluateAnswer}>
                  <div className="ai-question__meta">
                    Question {questionIndex + 1} of {questions.length}
                  </div>
                  <h3>
                    {questions[questionIndex].question ||
                      questions[questionIndex]}
                  </h3>
                  {questions[questionIndex].focus && (
                    <p>{questions[questionIndex].focus}</p>
                  )}
                  <label>
                    Your answer
                    <textarea
                      rows="6"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Write your answer as if speaking to an interviewer…"
                    />
                  </label>
                  <button className="ai-primary" disabled={busy}>
                    {busy ? "Reviewing answer…" : "Get feedback"}
                  </button>
                  {questionIndex < questions.length - 1 && (
                    <button
                      type="button"
                      className="ai-secondary"
                      onClick={() => {
                        setQuestionIndex((i) => i + 1);
                        setAnswer("");
                        setResult("");
                        setError("");
                      }}
                    >
                      Skip to next question
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
          {error && (
            <div className="ai-alert ai-alert--error" role="alert">
              {error}
            </div>
          )}
          {result && (
            <section className="ai-result" aria-live="polite">
              <h3>
                {activeTool === "job-match" ? "Resume skills" : "AI result"}
              </h3>
              <pre>{result}</pre>
            </section>
          )}
          {resultJobs.length > 0 && (
            <section className="ai-result">
              <h3>Matching jobs ({resultJobs.length})</h3>
              <div className="space-y-3">
                {resultJobs.map((job) => (
                  <article
                    key={job.id || job.applyUrl}
                    className="rounded-xl border bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold">
                          {job.title || job.role}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {job.company} · {job.location}
                        </p>
                        <p className="mt-2 text-sm">
                          Matched skills:{" "}
                          {(job.matchedSkills || []).join(", ") ||
                            "No direct skill matches"}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                        {job.matchScore ?? 0}% match
                      </span>
                    </div>
                    {job.applyUrl && (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                      >
                        View original listing <ArrowUpRight size={15} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
          {activeTool === "job-match" && result && resultJobs.length === 0 && (
            <p className="mt-4 text-sm text-slate-600">
              No matching listings were returned. Check provider credentials and
              try a broader role or location.
            </p>
          )}
        </section>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        <button
          onClick={() => navigate("/cover-letter")}
          className="rounded-xl border bg-white px-4 py-2.5 font-semibold"
        >
          Open Cover Letter Generator
        </button>
        <button
          onClick={() => navigate("/resume-jobs")}
          className="rounded-xl border bg-white px-4 py-2.5 font-semibold"
        >
          Open Resume Job Match
        </button>
        <button
          onClick={() => navigate("/billing")}
          className="rounded-xl border bg-white px-4 py-2.5 font-semibold"
        >
          Subscription & Billing
        </button>
      </div>
    </main>
  );
}
