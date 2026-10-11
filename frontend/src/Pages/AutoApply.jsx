import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  LoaderCircle,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com";

const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export default function AutoApply({ jobs = [], onClose }) {
  const [resume, setResume] = useState(null);
  const [experience, setExperience] = useState("");
  const [role, setRole] = useState("");
  const [minimumMatch, setMinimumMatch] = useState("70");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  const token = useMemo(
    () => localStorage.getItem("token") || sessionStorage.getItem("token"),
    [],
  );

  const handleResume = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!RESUME_TYPES.has(file.type)) {
      setResume(null);
      setError("Please select a PDF or DOCX resume.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResume(null);
      setError("Your resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setResume(file);
    setError("");
    setResults(null);
  };

  const startMatching = async (event) => {
    event.preventDefault();
    setError("");
    setResults(null);

    if (!token) {
      setError("Please sign in before using Auto Apply.");
      return;
    }
    if (!resume) {
      setError("Upload your resume to check it against the displayed jobs.");
      return;
    }
    if (!experience || !role.trim()) {
      setError("Enter your years of experience and interested job role.");
      return;
    }
    if (!jobs.length) {
      setError("There are no displayed jobs to check. Refresh or change your filters.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("resume", resume);
      body.append("experienceYears", experience);
      body.append("interestedRole", role.trim());
      body.append("minimumMatch", minimumMatch);
      body.append(
        "jobs",
        JSON.stringify(
          jobs.map((job) => ({
            id: job.id,
            company: job.company,
            title: job.role,
            location: job.location,
            experience: job.experience,
            description: job.description,
            skills: job.skills,
            source: job.source,
            applyUrl: job.applyUrl,
            type: job.type,
          })),
        ),
      );

      const response = await fetch(`${API_URL}/api/applications/auto-apply/match`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Could not check jobs against this resume.");
      }
      setResults(data);
    } catch (err) {
      setError(err.message || "Auto Apply could not process these jobs.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-apply-title"
        className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sparkles size={14} /> CareerHub automation
            </p>
            <h2 id="auto-apply-title" className="mt-1 text-xl font-semibold text-neutral-950">
              {jobs.length === 1 ? "Auto Apply to this job" : "Auto Apply to displayed jobs"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {jobs.length === 1 ? "Process this job" : `Process ${jobs.length} displayed jobs`} against your resume.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close Auto Apply"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={startMatching} className="space-y-5 p-5 sm:p-7">
          {!results && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">Resume *</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 transition hover:border-blue-400 hover:bg-blue-50/40">
                  <span className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                    {resume ? <FileText size={22} /> : <Upload size={22} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">
                      {resume ? resume.name : "Choose resume (PDF/DOC/DOCX)"}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">Maximum 5 MB. The resume is used to compare the jobs in this batch.</span>
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResume}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="auto-apply-experience" className="mb-2 block text-sm font-medium text-neutral-800">Years of experience *</label>
                  <select id="auto-apply-experience" value={experience} onChange={(event) => setExperience(event.target.value)} className={inputClass} required>
                    <option value="">Select experience</option>
                    <option value="0">Fresher / 0 years</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5 years</option>
                    <option value="6">6+ years</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="auto-apply-role" className="mb-2 block text-sm font-medium text-neutral-800">Interested job role *</label>
                  <input id="auto-apply-role" value={role} onChange={(event) => setRole(event.target.value)} className={inputClass} placeholder="e.g. Software Developer" maxLength={120} required />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="auto-apply-match" className="text-sm font-medium text-neutral-800">Minimum resume match</label>
                  <span className="text-sm font-semibold text-blue-700">{minimumMatch}%</span>
                </div>
                <input id="auto-apply-match" type="range" min="50" max="95" step="5" value={minimumMatch} onChange={(event) => setMinimumMatch(event.target.value)} className="w-full accent-blue-600" />
                <p className="mt-1 text-xs text-neutral-500">This is a keyword relevance estimate, not a guarantee of qualification.</p>
              </div>
            </>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
              <LoaderCircle size={20} className="animate-spin" /> Checking resume and job requirements for {jobs.length} listings…
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Checked", results.summary?.checked ?? results.results?.length ?? 0],
                  ["Applied", results.summary?.submitted ?? 0],
                  ["Not applied", (results.results || []).filter((item) => item.decision === "eligible" && item.applicationStatus !== "submitted").length],
                  ["Resume mismatch", results.summary?.resumeMismatch ?? 0],
                  ["Skipped", results.summary?.skipped ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-950">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                <strong>Submission note:</strong> CareerHub counts a job as Applied only after an authorized employer/provider integration confirms submission. The current Adzuna/Jooble listing feeds provide job listings, not a universal application-submission API. Eligible jobs without a supported integration are shown as Not applied, with an employer link when available.
              </div>
              <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
                {(results.results || []).map((item) => (
                  <article key={item.jobId} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-neutral-500">{item.company} · {item.location || "Location not specified"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.applicationStatus === "submitted" ? "bg-green-50 text-green-700" : item.decision === "resume_mismatch" ? "bg-amber-50 text-amber-800" : item.decision === "skipped" ? "bg-neutral-100 text-neutral-600" : "bg-red-50 text-red-700"}`}>
                        {item.applicationStatus === "submitted" ? "Applied" : item.decision === "resume_mismatch" ? "Not applied · Resume mismatch" : item.decision === "skipped" ? "Not applied · Ineligible" : "Not applied · Submission integration unavailable"}
                      </span>
                    </div>
                    {item.reasons?.length > 0 && <p className="mt-2 text-sm leading-5 text-neutral-600">{item.reasons.join(" ")}</p>}
                    {item.missingSkills?.length > 0 && <p className="mt-2 text-xs text-neutral-500">Not found in resume: {item.missingSkills.slice(0, 8).join(", ")}</p>}
                    {item.decision === "eligible" && item.applyUrl && (
                      <a href={item.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                        Continue on employer site <ExternalLink size={15} />
                      </a>
                    )}
                    {item.decision === "eligible" && !item.applyUrl && (
                      <p className="mt-3 text-xs text-neutral-500">No application URL was provided for this listing.</p>
                    )}
                  </article>
                ))}
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <button type="button" onClick={() => { setResults(null); setError(""); }} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Run again</button>
                <button type="button" onClick={onClose} className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">Done</button>
              </div>
            </div>
          )}

          {!results && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 pt-4">
              <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={busy || jobs.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {busy ? "Checking jobs…" : `Check ${jobs.length} jobs`}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
