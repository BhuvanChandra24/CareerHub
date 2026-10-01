import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  FileUp,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Target,
  X,
  ShieldCheck,
  Lightbulb,
  Search,
  BriefcaseBusiness,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

function ScoreCircle({ score }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const circumference = 2 * Math.PI * 43;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-neutral-100"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-all duration-700"
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-4xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-neutral-500">out of 100</p>
      </div>
    </div>
  );
}

function ResultList({ title, items, icon: Icon, color = "neutral" }) {
  const colors = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    neutral: "bg-neutral-100 text-neutral-800",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon size={19} />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>

      {Array.isArray(items) && items.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {items.map((item, index) => {
            const text =
              typeof item === "string"
                ? item
                : item?.message || item?.name || item?.text || "";

            return (
              <li
                key={`${text}-${index}`}
                className="flex gap-2.5 text-sm leading-6 text-neutral-600"
              >
                <CheckCircle2
                  size={16}
                  className="mt-1 shrink-0 text-neutral-400"
                />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-neutral-500">
          No results returned for this section.
        </p>
      )}
    </div>
  );
}

export default function ResumeATS() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    const allowed = ["pdf", "doc", "docx"];

    if (!allowed.includes(extension)) {
      setError("Please upload a PDF, DOC, or DOCX file.");
      return false;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Your resume must be smaller than 5 MB.");
      return false;
    }

    setError("");
    setFile(selectedFile);
    setResult(null);
    return true;
  };

  const handleFileChange = (event) => {
    validateFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const analyzeResume = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API_URL}/api/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Resume analysis failed.",
        );
      }

      const score = Number(data.score ?? data.atsScore);

      if (!Number.isFinite(score)) {
        throw new Error(
          "The API response did not contain a valid score or atsScore.",
        );
      }

      setResult({
        ...data,
        score: Math.max(0, Math.min(100, score)),
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the resume analysis service. Check your backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) inputRef.current.value = "";
  };

  const scoreLabel = (score) => {
    if (score >= 80) return "Strong match";
    if (score >= 60) return "Needs improvement";
    return "Needs attention";
  };

  const scoreColor = (score) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-amber-700";
    return "text-red-700";
  };

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
              Jobs
            </Link>
            <Link to="/resume-jobs" className="hover:text-black">
              AI Job Match
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

        {/* Heading */}
        <section className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            <Sparkles size={14} />
            RESUME INTELLIGENCE
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Make your resume
            <span className="block text-neutral-400">work harder for you.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Upload your resume to analyze its structure, keywords, skills, and
            compatibility with applicant tracking systems.
          </p>
        </section>

        <div className="mt-10 grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Upload panel */}
          <section className="h-fit rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
                <FileUp size={21} />
              </div>
              <div>
                <h2 className="font-semibold">Upload your resume</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  PDF, DOC or DOCX · Max 5 MB
                </p>
              </div>
            </div>

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
              className={`mt-7 flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition ${
                dragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-neutral-300 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <FileText size={27} className="text-neutral-700" />
              </div>

              <p className="mt-4 text-sm font-semibold">
                Drop your resume here
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                or click to browse your files
              </p>

              <span className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium">
                Choose resume
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <FileText size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetAnalysis}
                  aria-label="Remove resume"
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={analyzeResume}
              disabled={!file || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Analyzing resume...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Analyze My Resume
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-neutral-500">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              Your resume is sent to the configured backend for analysis. Only
              upload documents you have permission to share.
            </div>
          </section>

          {/* Results panel */}
          <section>
            {!result && !loading && (
              <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                  <Target size={29} />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Your resume report will appear here
                </h2>

                <p className="mt-3 max-w-md text-sm leading-7 text-neutral-500">
                  Upload your resume and start the analysis to see the score,
                  keyword feedback, and improvement recommendations.
                </p>

                <div className="mt-7 grid w-full max-w-lg grid-cols-2 gap-3 text-left">
                  {[
                    "ATS compatibility",
                    "Keyword coverage",
                    "Resume structure",
                    "Actionable feedback",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600"
                    >
                      <CheckCircle2 size={15} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white p-8 text-center">
                <LoaderCircle
                  size={42}
                  className="animate-spin text-blue-600"
                />
                <h2 className="mt-5 text-xl font-semibold">
                  Analyzing your resume
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-neutral-500">
                  Your backend is processing the uploaded document. This may
                  take a few moments.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                {/* Score card */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <ScoreCircle score={result.score} />

                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Resume analysis complete
                      </p>

                      <h2
                        className={`mt-2 text-2xl font-semibold ${scoreColor(result.score)}`}
                      >
                        {scoreLabel(result.score)}
                      </h2>

                      <p className="mt-3 text-sm leading-7 text-neutral-600">
                        {result.summary ||
                          result.feedback ||
                          "Review the detailed feedback below to identify possible improvements."}
                      </p>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
                        <FileText size={14} />
                        {file?.name}
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                    An ATS score is an estimate, not a guarantee of passing an
                    employer's screening. Results vary by job description and
                    employer system.
                  </p>
                </div>

                {/* Detail cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultList
                    title="Resume strengths"
                    items={result.strengths}
                    icon={CheckCircle2}
                    color="green"
                  />

                  <ResultList
                    title="Areas to improve"
                    items={result.improvements || result.recommendations}
                    icon={Lightbulb}
                    color="amber"
                  />

                  <ResultList
                    title="Missing keywords"
                    items={result.missingKeywords || result.keywordsMissing}
                    icon={Search}
                    color="blue"
                  />

                  <ResultList
                    title="Formatting feedback"
                    items={result.formattingIssues || result.formattingFeedback}
                    icon={FileText}
                    color="neutral"
                  />
                </div>

                {result.sections && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                    <h3 className="font-semibold">Section analysis</h3>
                    <div className="mt-4 space-y-3">
                      {Object.entries(result.sections).map(([name, value]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                        >
                          <span className="text-sm capitalize text-neutral-600">
                            {name.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === "object"
                              ? (value.score ?? value.status ?? "Reviewed")
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetAnalysis}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium hover:bg-neutral-50"
                  >
                    <RotateCcw size={16} />
                    Analyze another resume
                  </button>

                  <Link
                    to="/resume-jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    Find matching jobs
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
