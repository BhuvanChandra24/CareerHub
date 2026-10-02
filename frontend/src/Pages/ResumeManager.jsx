import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Star,
  Trash2,
  Upload,
  GitCompare,
  RefreshCw,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function api(path, options = {}) {
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Request failed.");
  return d;
}
export default function ResumeManager() {
  const input = useRef(null);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [compare, setCompare] = useState(null);
  const load = useCallback(async () => {
    try {
      setItems((await api("/api/resumes")).resumes || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const upload = async (e) => {
    e.preventDefault();
    if (!file) return setError("Choose a resume first.");
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      if (name) fd.append("name", name);
      const d = await api("/api/resumes", { method: "POST", body: fd });
      setItems((x) => [d.resume, ...x]);
      setFile(null);
      setName("");
      if (input.current) input.current.value = "";
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const defaultIt = async (id) => {
    try {
      const d = await api(`/api/resumes/${id}/default`, { method: "POST" });
      setItems((x) =>
        x.map((r) => ({ ...r, isDefault: r._id === d.resume._id })),
      );
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await api(`/api/resumes/${id}`, { method: "DELETE" });
      setItems((x) => x.filter((r) => r._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  const runCompare = async () => {
    if (items.length < 2)
      return setError("Add at least two resumes to compare.");
    try {
      const d = await api(
        `/api/resumes/compare?a=${items[0]._id}&b=${items[1]._id}`,
      );
      setCompare(d);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-5 py-8">
        <Link to="/dashboard" className="text-sm text-blue-700">
          ← Dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Resume management
            </p>
            <h1 className="mt-1 text-3xl font-bold">Your resume library</h1>
            <p className="mt-2 text-slate-600">
              Keep multiple versions, set a default resume, and compare
              versions.
            </p>
          </div>
          <button
            onClick={runCompare}
            className="rounded-xl border bg-white px-4 py-2.5 font-semibold"
          >
            <GitCompare size={16} className="mr-2 inline" />
            Compare first two
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <form
          onSubmit={upload}
          className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-[1fr_1fr_auto]"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Resume name (e.g. Full Stack Resume)"
            className="rounded-xl border px-4 py-3"
          />
          <input
            ref={input}
            required
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="rounded-xl border px-3 py-2.5"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            <Upload size={16} className="mr-2 inline" />
            {busy ? "Analyzing…" : "Add resume"}
          </button>
        </form>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((r) => (
            <article key={r._id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <FileText size={22} />
                  </span>
                  <div>
                    <h2 className="font-bold">{r.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.fileName} · {r.versions?.length || 1} version(s)
                    </p>
                  </div>
                </div>
                {r.isDefault && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => defaultIt(r._id)}
                  disabled={r.isDefault}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <Star size={14} className="mr-1 inline" />
                  Set default
                </button>
                <button
                  onClick={() => remove(r._id)}
                  className="rounded-lg border px-3 py-2 text-sm text-red-600"
                >
                  <Trash2 size={14} className="mr-1 inline" />
                  Delete
                </button>
                <Link
                  to="/resume-optimizer"
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Analyze again
                </Link>
              </div>
              {r.analysis?.score !== undefined && (
                <p className="mt-4 text-sm text-slate-600">
                  Latest analysis score: <strong>{r.analysis.score}/100</strong>
                </p>
              )}
            </article>
          ))}
        </div>
        {!items.length && (
          <div className="mt-6 rounded-2xl border bg-white p-10 text-center text-slate-500">
            No saved resumes yet.
          </div>
        )}
        {compare && (
          <section className="mt-6 rounded-2xl border bg-white p-5">
            <h2 className="font-bold">Resume comparison</h2>
            <p className="mt-1 text-sm text-slate-500">
              {compare.first.name} → {compare.second.name}:{" "}
              {compare.commonKeywordCount} common keywords
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">Added keywords</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {compare.addedKeywords.join(", ") || "None detected"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Removed keywords</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {compare.removedKeywords.join(", ") || "None detected"}
                </p>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
