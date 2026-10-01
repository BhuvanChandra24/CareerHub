import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  LayoutDashboard,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const STATUSES = [
  "Draft",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Expired",
  "Archived",
];
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

const blank = {
  company: "",
  jobTitle: "",
  jobDescription: "",
  applicationDate: new Date().toISOString().slice(0, 10),
  deadline: "",
  source: "",
  location: "",
  status: "Draft",
  notes: "",
};

export default function ApplicationsTracker() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/tracker/applications");
      setItems(data.applications || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      items.filter(
        (x) =>
          (statusFilter === "All statuses" || x.status === statusFilter) &&
          `${x.company} ${x.jobTitle} ${x.location} ${x.source}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, statusFilter],
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const path = editingId
        ? `/api/tracker/applications/${editingId}`
        : "/api/tracker/applications";
      const data = await api(path, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setItems((prev) =>
        editingId
          ? prev.map((x) => (x._id === editingId ? data.application : x))
          : [data.application, ...prev],
      );
      setForm(blank);
      setEditingId("");
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    }
  };
  const edit = (item) => {
    setForm({
      company: item.company || "",
      jobTitle: item.jobTitle || "",
      jobDescription: item.jobDescription || "",
      applicationDate: item.applicationDate?.slice(0, 10) || "",
      deadline: item.deadline?.slice(0, 10) || "",
      source: item.source || "",
      location: item.location || "",
      status: item.status || "Draft",
      notes: item.notes || "",
    });
    setEditingId(item._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await api(`/api/tracker/applications/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="font-bold text-xl">
            CareerHub
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/ai-tools">AI Toolkit</Link>
            <Link to="/cover-letter">Cover Letter</Link>
            <Link to="/workspace/roadmap">Career Roadmap</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Job search CRM
            </p>
            <h1 className="mt-1 text-3xl font-bold">Application Tracker</h1>
            <p className="mt-2 text-slate-600">
              Manage applications, deadlines, statuses and notes in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-xl border bg-white px-4 py-2.5"
            >
              <RefreshCw size={16} className="mr-2 inline" />
              Refresh
            </button>
            <button
              onClick={() => {
                setForm(blank);
                setEditingId("");
                setShowForm((v) => !v);
              }}
              className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"
            >
              <Plus size={16} className="mr-2 inline" />
              Add application
            </button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}
        {showForm && (
          <form
            onSubmit={submit}
            className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"
          >
            <h2 className="md:col-span-2 text-lg font-semibold">
              {editingId ? "Edit application" : "New application"}
            </h2>
            {[
              ["company", "Company name"],
              ["jobTitle", "Job title"],
              ["source", "Job source"],
              ["location", "Location"],
              ["applicationDate", "Application date"],
              ["deadline", "Deadline"],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <input
                  required={["company", "jobTitle"].includes(key)}
                  type={
                    key.includes("Date") || key === "deadline" ? "date" : "text"
                  }
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                />
              </label>
            ))}
            <label className="text-sm font-medium">
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Job description
              <textarea
                rows="3"
                value={form.jobDescription}
                onChange={(e) =>
                  setForm({ ...form, jobDescription: e.target.value })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Notes / activity
              <textarea
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              />
            </label>
            <div className="flex gap-2 md:col-span-2">
              <button
                className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white"
                disabled={busy}
              >
                Save application
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId("");
                }}
                className="rounded-lg border px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.slice(0, 4).map((s) => (
            <div key={s} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-slate-500">{s}</p>
              <p className="mt-1 text-2xl font-bold">
                {items.filter((x) => x.status === s).length}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-xl border bg-white px-3">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, role, location..."
              className="w-full border-0 py-3 outline-none"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2"
          >
            <option>All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Your applications</h2>
            <span className="text-sm text-slate-500">
              {visible.length} records
            </span>
          </div>
          {busy && !items.length ? (
            <p className="p-8 text-slate-500">Loading applications…</p>
          ) : visible.length ? (
            <div className="divide-y">
              {visible.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4"
                >
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <BriefcaseBusiness />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.jobTitle}</h3>
                      <p className="text-sm text-slate-600">
                        {item.company}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Applied:{" "}
                        {item.applicationDate?.slice(0, 10) || "Not set"}
                        {item.deadline
                          ? ` · Deadline: ${item.deadline.slice(0, 10)}`
                          : ""}
                      </p>
                      {item.notes && (
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Application status"
                      value={item.status}
                      onChange={async (e) => {
                        try {
                          const data = await api(
                            `/api/tracker/applications/${item._id}`,
                            {
                              method: "PATCH",
                              body: JSON.stringify({ status: e.target.value }),
                            },
                          );
                          setItems((prev) =>
                            prev.map((x) =>
                              x._id === item._id ? data.application : x,
                            ),
                          );
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="rounded-lg border px-2 py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => edit(item)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(item._id)}
                      aria-label="Delete application"
                      className="rounded-lg border p-2 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <LayoutDashboard size={28} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-semibold">No applications yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add your first application to start tracking progress.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
