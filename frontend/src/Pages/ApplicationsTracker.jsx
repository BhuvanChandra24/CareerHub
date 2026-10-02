import React, { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  RefreshCw,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function req(path, options = {}) {
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Request failed.");
  return d;
}
const statuses = [
  "submitted",
  "reviewing",
  "interview",
  "offer",
  "rejected",
  "closed",
];
export default function ApplicationsTracker() {
  const location = useLocation();
  const [apps, setApps] = useState([]);
  const [manual, setManual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    jobTitle: "",
    source: "",
    location: "",
    status: "Applied",
    notes: "",
  });
  const load = async () => {
    setLoading(true);
    try {
      const [a, m] = await Promise.all([
        req("/api/applications/mine"),
        req("/api/tracker/applications"),
      ]);
      setApps(a.applications || []);
      setManual(m.applications || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("company") || q.get("title"))
      setForm((f) => ({
        ...f,
        company: q.get("company") || "",
        jobTitle: q.get("title") || "",
        source: q.get("source") || "",
        status: "Applied",
      }));
    load();
  }, [location.search]);
  const add = async (e) => {
    e.preventDefault();
    try {
      await req("/api/tracker/applications", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          applicationDate: new Date().toISOString(),
        }),
      });
      setForm({
        company: "",
        jobTitle: "",
        source: "",
        location: "",
        status: "Applied",
        notes: "",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Applications
            </p>
            <h1 className="text-3xl font-bold">Application tracking</h1>
            <p className="mt-2 text-slate-600">
              Jobs stay on the Jobs page. Once you apply, the application and
              its status appear here and on your dashboard.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border bg-white px-4 py-2 text-sm"
          >
            <RefreshCw size={15} className="mr-2 inline" />
            Refresh
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Submitted", apps.filter((a) => a.status === "submitted").length],
            ["Reviewing", apps.filter((a) => a.status === "reviewing").length],
            ["Interview", apps.filter((a) => a.status === "interview").length],
            ["Offers", apps.filter((a) => a.status === "offer").length],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">{l}</p>
              <p className="mt-2 text-3xl font-bold">{loading ? "—" : v}</p>
            </div>
          ))}
        </section>
        <section className="mt-7 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">CareerHub applications</h2>
          {apps.length ? (
            <div className="mt-4 divide-y">
              {apps.map((a) => (
                <article key={a._id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{a.jobTitle}</h3>
                      <p className="text-sm text-slate-500">
                        {a.company} · Applied{" "}
                        {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <select
                      value={a.status}
                      onChange={async (e) => {
                        try {
                          const d = await req(
                            `/api/applications/mine/${a._id}`,
                            {
                              method: "PATCH",
                              body: JSON.stringify({ status: e.target.value }),
                            },
                          );
                          setApps((x) =>
                            x.map((v) => (v._id === a._id ? d.application : v)),
                          );
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="rounded-full border bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(a.statusHistory || []).map((h, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                      >
                        {label(h.status)} ·{" "}
                        {new Date(h.date).toLocaleDateString()}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No CareerHub applications yet.{" "}
              <Link className="font-semibold text-blue-700" to="/jobs">
                Browse jobs →
              </Link>
            </p>
          )}
        </section>
        <section className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={add} className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold">Track an external application</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use this after applying on an external job source.
            </p>
            {[
              ["company", "Company"],
              ["jobTitle", "Job title"],
              ["source", "Source"],
              ["location", "Location"],
            ].map(([k, l]) => (
              <label key={k} className="mt-4 block text-sm font-medium">
                {l}
                <input
                  required={k !== "location"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-4 py-3 font-normal"
                />
              </label>
            ))}
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
              className="mt-4 w-full rounded-xl border px-4 py-3"
              rows="3"
            />
            <button className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">
              Save tracking
            </button>
          </form>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold">External applications</h2>
            {manual.length ? (
              <div className="mt-4 divide-y">
                {manual.map((a) => (
                  <article key={a._id} className="py-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{a.jobTitle}</h3>
                        <p className="text-sm text-slate-500">
                          {a.company} · {a.source || "External source"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(
                        a.applicationDate || a.createdAt,
                      ).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No external applications tracked.
              </p>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
