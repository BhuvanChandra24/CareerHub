import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  MessageSquare,
  Route,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

import "./AIToolkit.css";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

const tools = [
  {
    id: "resume",
    icon: FileText,
    tag: "RESUME AI",
    title: "Resume Analysis AI",
    description:
      "Review your resume structure, skills, strengths, gaps and practical improvements. This is an AI review, not a hiring guarantee.",
  },
  {
    id: "ats",
    icon: FileCheck2,
    tag: "ATS SCORE",
    title: "ATS Score for Resume",
    description:
      "Run CareerHub's rule-based screening estimate for sections, contact details, skills and resume content. It is an estimate, not a real employer ATS.",
  },
  {
    id: "job-match",
    icon: Target,
    tag: "JOB MATCHING",
    title: "Resume ↔ Job Matching",
    description:
      "Compare the skills detected in your resume with jobs returned by your configured providers and see matched skills.",
  },
  {
    id: "cover-letter",
    icon: BriefcaseBusiness,
    tag: "APPLICATIONS",
    title: "Cover Letter Generation",
    description:
      "Generate a job-specific draft from the facts you provide. CareerHub will not invent qualifications or achievements.",
  },
  {
    id: "interview",
    icon: MessageSquare,
    tag: "PRACTICE",
    title: "Interview AI",
    description:
      "Generate role-specific questions and receive structured feedback on your answer.",
  },
  {
    id: "roadmap",
    icon: Route,
    tag: "CAREER PLANNING",
    title: "AI Career Roadmap",
    description:
      "Turn your target role, current skills and goals into a practical learning and application roadmap.",
  },
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export default function AIToolkit() {
  const location = useLocation();
  const navigate = useNavigate();

  const requested = new URLSearchParams(location.search).get("tool");

  const [active, setActive] = useState(
    tools.some((x) => x.id === requested) ? requested : "",
  );

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [jobLocation, setJobLocation] = useState("India");

  const [cover, setCover] = useState({
    fullName: "",
    company: "",
    jobTitle: "",
    resumeText: "",
    jobDescription: "",
    tone: "Professional",
  });

  const [interview, setInterview] = useState({
    role: "Frontend Developer",
    level: "Fresher",
    count: 5,
    answer: "",
  });

  const [roadmap, setRoadmap] = useState({
    targetRole: "",
    currentSkills: "",
    experience: "Fresher",
    timeline: "3 months",
  });

  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [result, setResult] = useState("");
  const [jobs, setJobs] = useState([]);
  const [ats, setAts] = useState(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = (id) => {
    setActive(id);
    setError("");
    setResult("");
    setJobs([]);
    setAts(null);
    setQuestions([]);

    navigate(`/ai-tools?tool=${id}`);
  };

  const back = () => {
    setActive("");
    setError("");

    navigate("/ai-tools", {
      replace: true,
    });
  };

  const requireFile = () => {
    if (!file) {
      setError("Upload your PDF or DOCX resume first.");
      return false;
    }

    return true;
  };

  const submitFileAI = async (endpoint, extra = {}) => {
    if (!requireFile()) return;

    setBusy(true);
    setError("");
    setResult("");

    try {
      const form = new FormData();

      form.append("resume", file);

      Object.entries(extra).forEach(([k, v]) => {
        form.append(k, v);
      });

      const data = await api(endpoint, {
        method: "POST",
        body: form,
      });

      return data;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const analyze = async (e) => {
    e.preventDefault();

    const data = await submitFileAI("/api/ai/resume/analyze", {
      jobDescription,
    });

    if (data) {
      setResult(data.result || "No analysis returned.");
    }
  };

  const atsScore = async (e) => {
    e.preventDefault();

    if (!requireFile()) return;

    setBusy(true);
    setError("");

    try {
      const form = new FormData();

      form.append("resume", file);

      const data = await api("/api/resume/analyze", {
        method: "POST",
        body: form,
      });

      setAts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const match = async (e) => {
    e.preventDefault();

    const data = await submitFileAI("/api/resume/match-jobs", {
      keyword,
      location: jobLocation,
    });

    if (data) {
      setJobs(data.jobs || []);
    }
  };

  const coverLetter = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError("");
    setResult("");

    try {
      const data = await api("/api/ai/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cover),
      });

      setResult(data.result || "No cover letter returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const generateInterview = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError("");
    setQuestions([]);

    try {
      const data = await api("/api/ai/mock-interview/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: interview.role,
          level: interview.level,
          count: Number(interview.count),
        }),
      });

      setQuestions(data.questions || []);
      setQuestionIndex(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const evaluate = async (e) => {
    e.preventDefault();

    const q = questions[questionIndex];

    if (!q || !interview.answer.trim()) {
      setError("Write your answer first.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data = await api("/api/ai/mock-interview/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: interview.role,
          level: interview.level,
          question: q.question || q,
          answer: interview.answer,
        }),
      });

      setResult(data.result || "No feedback returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const generateRoadmap = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError("");
    setResult("");

    try {
      const data = await api("/api/ai/career-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Create a practical career roadmap for the target role ${roadmap.targetRole}. Current skills: ${roadmap.currentSkills}. Experience: ${roadmap.experience}. Timeline: ${roadmap.timeline}. Include skills to learn, projects, interview preparation and job-search actions. Clearly separate assumptions from user-provided facts.`,
          context: {
            targetRole: roadmap.targetRole,
            level: roadmap.experience,
          },
        }),
      });

      setResult(data.result || "No roadmap returned.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="ai-toolkit">


      <section className="ai-toolkit__hero">
        <span className="ai-toolkit__eyebrow">
          CAREERHUB · AI TOOLS
        </span>

        <h1>AI tools for each step of your career.</h1>

        <p>
          Choose a tool, provide the information it actually needs, and get a
          focused result. CareerHub labels estimates clearly and does not
          promise hiring outcomes.
        </p>
      </section>

      {!active ? (
        <section className="ai-toolkit__grid">
          {tools.map(
            ({ id, icon: Icon, tag, title, description }) => (
              <article className="ai-tool-card" key={id}>
                <div className="ai-tool-card__top">
                  <span className="ai-tool-card__icon">
                    <Icon size={24} />
                  </span>

                  <span className="ai-tool-card__tag">
                    {tag}
                  </span>
                </div>

                <h2>{title}</h2>

                <p>{description}</p>

                <button
                  className="ai-tool-card__link"
                  onClick={() => open(id)}
                >
                  Open tool <ArrowUpRight size={16} />
                </button>
              </article>
            ),
          )}
        </section>
      ) : (
        <section className="ai-toolkit__workspace">
          <button className="ai-tool-back" onClick={back}>
            <ArrowLeft size={16} />
            All AI tools
          </button>

          <div className="ai-tool-workspace__head">
            <div>
              <span className="ai-toolkit__eyebrow">
                {tools.find((x) => x.id === active)?.tag}
              </span>

              <h2>
                {tools.find((x) => x.id === active)?.title}
              </h2>

              <p>
                {tools.find((x) => x.id === active)?.description}
              </p>
            </div>
          </div>

          {error && <div className="ai-error">{error}</div>}

          {active === "resume" && (
            <form onSubmit={analyze} className="ai-form">
              <FileUpload
                file={file}
                setFile={setFile}
              />

              <label>
                Target job description (optional)

                <textarea
                  rows="7"
                  value={jobDescription}
                  onChange={(e) =>
                    setJobDescription(e.target.value)
                  }
                  placeholder="Paste the job description if you want a role-specific review."
                />
              </label>

              <button disabled={busy}>
                {busy ? "Analyzing…" : "Analyze resume"}
              </button>
            </form>
          )}

          {active === "ats" && (
            <form onSubmit={atsScore} className="ai-form">
              <FileUpload
                file={file}
                setFile={setFile}
              />

              <p className="ai-note">
                This score is CareerHub's rule-based screening
                estimate. It is not an employer's proprietary ATS
                score.
              </p>

              <button disabled={busy}>
                {busy
                  ? "Checking…"
                  : "Calculate ATS estimate"}
              </button>
            </form>
          )}

          {active === "job-match" && (
            <form onSubmit={match} className="ai-form">
              <FileUpload
                file={file}
                setFile={setFile}
              />

              <div className="ai-form-grid">
                <label>
                  Keyword

                  <input
                    value={keyword}
                    onChange={(e) =>
                      setKeyword(e.target.value)
                    }
                    placeholder="React, Java, Data Analyst..."
                  />
                </label>

                <label>
                  Location

                  <input
                    value={jobLocation}
                    onChange={(e) =>
                      setJobLocation(e.target.value)
                    }
                  />
                </label>
              </div>

              <button disabled={busy}>
                {busy
                  ? "Matching…"
                  : "Match my resume to jobs"}
              </button>
            </form>
          )}

          {active === "cover-letter" && (
            <form onSubmit={coverLetter} className="ai-form">
              <div className="ai-form-grid">
                {[
                  ["fullName", "Your name"],
                  ["company", "Company"],
                  ["jobTitle", "Job title"],
                ].map(([k, l]) => (
                  <label key={k}>
                    {l}

                    <input
                      required
                      value={cover[k]}
                      onChange={(e) =>
                        setCover({
                          ...cover,
                          [k]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}

                <label>
                  Tone

                  <select
                    value={cover.tone}
                    onChange={(e) =>
                      setCover({
                        ...cover,
                        tone: e.target.value,
                      })
                    }
                  >
                    <option>Professional</option>
                    <option>Warm and confident</option>
                    <option>Concise</option>
                  </select>
                </label>
              </div>

              <label>
                Resume facts

                <textarea
                  rows="6"
                  value={cover.resumeText}
                  onChange={(e) =>
                    setCover({
                      ...cover,
                      resumeText: e.target.value,
                    })
                  }
                  placeholder="Only include real skills, projects, education and experience."
                />
              </label>

              <label>
                Job description

                <textarea
                  required
                  rows="7"
                  value={cover.jobDescription}
                  onChange={(e) =>
                    setCover({
                      ...cover,
                      jobDescription: e.target.value,
                    })
                  }
                />
              </label>

              <button disabled={busy}>
                {busy
                  ? "Generating…"
                  : "Generate cover letter"}
              </button>
            </form>
          )}

          {active === "interview" && (
            <form
              onSubmit={generateInterview}
              className="ai-form"
            >
              <div className="ai-form-grid">
                <label>
                  Target role

                  <input
                    required
                    value={interview.role}
                    onChange={(e) =>
                      setInterview({
                        ...interview,
                        role: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Level

                  <select
                    value={interview.level}
                    onChange={(e) =>
                      setInterview({
                        ...interview,
                        level: e.target.value,
                      })
                    }
                  >
                    <option>Fresher</option>
                    <option>Junior</option>
                    <option>Mid-level</option>
                  </select>
                </label>

                <label>
                  Questions

                  <select
                    value={interview.count}
                    onChange={(e) =>
                      setInterview({
                        ...interview,
                        count: e.target.value,
                      })
                    }
                  >
                    <option>5</option>
                    <option>8</option>
                    <option>10</option>
                  </select>
                </label>
              </div>

              <button disabled={busy}>
                {busy
                  ? "Generating…"
                  : "Generate interview questions"}
              </button>

              {questions.length > 0 && (
                <div className="ai-question">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Question {questionIndex + 1} of{" "}
                    {questions.length}
                  </p>

                  <h3>
                    {questions[questionIndex]?.question ||
                      questions[questionIndex]}
                  </h3>

                  <textarea
                    rows="7"
                    value={interview.answer}
                    onChange={(e) =>
                      setInterview({
                        ...interview,
                        answer: e.target.value,
                      })
                    }
                    placeholder="Write your answer here..."
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="secondary"
                      disabled={questionIndex === 0}
                      onClick={() =>
                        setQuestionIndex(
                          Math.max(
                            0,
                            questionIndex - 1,
                          ),
                        )
                      }
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      disabled={
                        questionIndex ===
                        questions.length - 1
                      }
                      onClick={() => {
                        setQuestionIndex(
                          Math.min(
                            questions.length - 1,
                            questionIndex + 1,
                          ),
                        );

                        setInterview({
                          ...interview,
                          answer: "",
                        });
                      }}
                    >
                      Next
                    </button>

                    <button
                      type="button"
                      onClick={evaluate}
                      disabled={busy}
                    >
                      Evaluate answer
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {active === "roadmap" && (
            <form
              onSubmit={generateRoadmap}
              className="ai-form"
            >
              <div className="ai-form-grid">
                <label>
                  Target role

                  <input
                    required
                    value={roadmap.targetRole}
                    onChange={(e) =>
                      setRoadmap({
                        ...roadmap,
                        targetRole: e.target.value,
                      })
                    }
                    placeholder="Full Stack Developer"
                  />
                </label>

                <label>
                  Experience

                  <select
                    value={roadmap.experience}
                    onChange={(e) =>
                      setRoadmap({
                        ...roadmap,
                        experience: e.target.value,
                      })
                    }
                  >
                    <option>Fresher</option>
                    <option>Junior</option>
                    <option>Mid-level</option>
                  </select>
                </label>

                <label>
                  Timeline

                  <select
                    value={roadmap.timeline}
                    onChange={(e) =>
                      setRoadmap({
                        ...roadmap,
                        timeline: e.target.value,
                      })
                    }
                  >
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>12 months</option>
                  </select>
                </label>
              </div>

              <label>
                Current skills

                <textarea
                  required
                  rows="6"
                  value={roadmap.currentSkills}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      currentSkills: e.target.value,
                    })
                  }
                  placeholder="React, Node.js, MongoDB..."
                />
              </label>

              <button disabled={busy}>
                {busy
                  ? "Building roadmap…"
                  : "Generate career roadmap"}
              </button>
            </form>
          )}

          {ats && (
            <Result title="ATS screening estimate">
              <div className="ats-score">
                {ats.atsScore ?? ats.score}
                <span>/100</span>
              </div>

              <p>{ats.summary}</p>

              {ats.improvements?.length > 0 && (
                <ul>
                  {ats.improvements.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              )}
            </Result>
          )}

          {result && (
            <Result title="AI result">
              <pre>{result}</pre>
            </Result>
          )}

          {jobs.length > 0 && (
            <Result title={`Matched jobs (${jobs.length})`}>
              <div className="ai-jobs">
                {jobs.slice(0, 20).map((job, i) => (
                  <article key={job.id || i}>
                    <h4>{job.title || job.role}</h4>

                    <p>
                      {job.company ||
                        job.company_name ||
                        "Company not specified"}{" "}
                      · {job.location ||
                        "Location not specified"}
                    </p>

                    <span>
                      {job.matchPercentage ??
                        job.matchScore ??
                        0}
                      % skill match
                    </span>
                  </article>
                ))}
              </div>
            </Result>
          )}
        </section>
      )}
    </main>
  );
}

function FileUpload({ file, setFile }) {
  return (
    <label className="ai-upload">
      <Upload size={19} />

      <span>
        {file
          ? file.name
          : "Upload your PDF or DOCX resume"}
      </span>

      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />
    </label>
  );
}

function Result({ title, children }) {
  return (
    <section className="ai-result">
      <h3>{title}</h3>
      {children}
    </section>
  );
}