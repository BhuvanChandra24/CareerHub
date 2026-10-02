import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/);
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const sections = {
  activities: {
    title: "Activity Tracker",
    intro: "Log job-search tasks and time spent.",
    fields: [
      ["date", "Date", "date"],
      ["durationMinutes", "Duration (minutes)", "number"],
      ["status", "Status", "text"],
    ],
  },
  contacts: {
    title: "Networking CRM",
    intro: "Keep professional contacts and interaction notes.",
    fields: [
      ["company", "Company", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["status", "Relationship status", "text"],
    ],
  },
  companies: {
    title: "Company Database",
    intro: "Save companies and reusable job-search notes.",
    fields: [
      ["website", "Website", "url"],
      ["location", "Location", "text"],
      ["status", "Status", "text"],
    ],
  },
  roadmap: {
    title: "Career Roadmap",
    intro: "Create milestones and track career goals.",
    fields: [
      ["dueDate", "Target date", "date"],
      ["status", "Status (Planned / In progress / Complete)", "text"],
      ["progress", "Progress (%)", "number"],
    ],
  },
  learning: {
    title: "Learning Library",
    intro: "Keep a personal list of courses, webinars and learning resources.",
    fields: [
      ["url", "Resource URL", "url"],
      ["category", "Category", "text"],
      ["status", "Progress status", "text"],
    ],
  },
};
async function call(path, options = {}) {
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Request failed.");
  return d;
}
export default function CareerWorkspace() {
  const { section = "activities" } = useParams();
  const config = sections[section] || sections.activities;
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extra, setExtra] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const d = await call(`/api/workspace/${section}`);
      setItems(d.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [section]);
  useEffect(() => {
    load();
    setTitle("");
    setDescription("");
    setExtra({});
  }, [load]);
  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const d = await call(`/api/workspace/${section}`, {
        method: "POST",
        body: JSON.stringify({ title, description, ...extra }),
      });
      setItems((p) => [d.item, ...p]);
      setTitle("");
      setDescription("");
      setExtra({});
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await call(`/api/workspace/${section}/${id}`, { method: "DELETE" });
      setItems((p) => p.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  const toggle = async (item) => {
    const status = item.status === "Complete" ? "Planned" : "Complete";
    try {
      const d = await call(`/api/workspace/${section}/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, completed: status === "Complete" }),
      });
      setItems((p) => p.map((x) => (x._id === item._id ? d.item : x)));
    } catch (e) {
      setError(e.message);
    }
  };
  const nav = Object.keys(sections);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Career workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold">{config.title}</h1>
        <p className="mt-2 text-slate-600">{config.intro}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {nav.map((n) => (
            <Link
              key={n}
              to={`/workspace/${n}`}
              className={`rounded-full border px-4 py-2 text-sm capitalize ${n === section ? "border-blue-700 bg-blue-700 text-white" : "bg-white"}`}
            >
              {n}
            </Link>
          ))}
        </div>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}
        <form onSubmit={add} className="mt-6 rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">
            Add{" "}
            {section === "contacts"
              ? "contact"
              : section === "companies"
                ? "company"
                : section === "roadmap"
                  ? "milestone"
                  : section === "learning"
                    ? "resource"
                    : "activity"}
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium md:col-span-2">
              Title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                placeholder={
                  section === "contacts"
                    ? "Contact name"
                    : section === "companies"
                      ? "Company name"
                      : section === "roadmap"
                        ? "Milestone"
                        : section === "learning"
                          ? "Course or resource title"
                          : "Activity name"
                }
              />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Notes / description
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              />
            </label>
            {config.fields.map(([name, label, type]) => (
              <label key={name} className="text-sm font-medium">
                {label}
                <input
                  type={type}
                  min={type === "number" ? 0 : undefined}
                  max={name === "progress" ? 100 : undefined}
                  value={extra[name] ?? ""}
                  onChange={(e) =>
                    setExtra((p) => ({
                      ...p,
                      [name]:
                        type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                />
              </label>
            ))}
          </div>
          <button className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white">
            <Plus size={16} className="mr-2 inline" />
            Save
          </button>
        </form>
        <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Saved {section}</h2>
            <button onClick={load} className="text-sm">
              <RefreshCw size={14} className="mr-1 inline" />
              Refresh
            </button>
          </div>
          {busy && !items.length ? (
            <p className="p-6 text-slate-500">Loading…</p>
          ) : items.length ? (
            <div className="divide-y">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-wrap items-start justify-between gap-3 p-4"
                >
                  <div className="flex gap-3">
                    <CheckCircle2
                      className={
                        item.status === "Complete"
                          ? "text-green-600"
                          : "text-slate-300"
                      }
                      size={20}
                    />
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {Object.entries(item.data || {})
                          .filter(
                            ([, v]) =>
                              v !== "" && v !== null && v !== undefined,
                          )
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                        {item.status ? ` · ${item.status}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggle(item)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      {item.status === "Complete" ? "Reopen" : "Mark complete"}
                    </button>
                    <button
                      onClick={() => remove(item._id)}
                      aria-label="Delete item"
                      className="rounded-lg border p-2 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              No records yet. Add your first item above.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
