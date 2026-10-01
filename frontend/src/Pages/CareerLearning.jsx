import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Video,
  CalendarDays,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqx.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const categories = [
  {
    id: "video",
    label: "Videos",
    icon: Video,
    hint: "Tutorials, recorded lessons and technical walkthroughs",
  },
  {
    id: "webinar",
    label: "Webinars",
    icon: CalendarDays,
    hint: "Live sessions, workshops and event recordings",
  },
  {
    id: "blog",
    label: "Blog",
    icon: FileText,
    hint: "Articles, guides and career insights",
  },
  {
    id: "course",
    label: "Courses",
    icon: GraduationCap,
    hint: "Structured courses and learning paths",
  },
];
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export default function CareerLearning() {
  const [active, setActive] = useState("video");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    status: "Not started",
  });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/workspace/learning");
      setItems(data.items || []);
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
        (item) =>
          (item.data?.type || item.data?.category || "video").toLowerCase() ===
          active,
      ),
    [items, active],
  );
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await api("/api/workspace/learning", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          url: form.url.trim(),
          category: active,
          type: active,
          status: form.status,
        }),
      });
      setItems((old) => [data.item, ...old]);
      setForm({ title: "", url: "", description: "", status: "Not started" });
      setNotice("Learning resource saved to your account.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    if (!window.confirm("Remove this learning resource?")) return;
    try {
      await api(`/api/workspace/learning/${id}`, { method: "DELETE" });
      setItems((old) => old.filter((item) => item._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  const updateStatus = async (item, status) => {
    try {
      const data = await api(`/api/workspace/learning/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          completed: status === "Completed",
          data: {
            ...(item.data || {}),
            type: active,
            category: active,
            url: item.data?.url || "",
          },
        }),
      });
      setItems((old) => old.map((x) => (x._id === item._id ? data.item : x)));
    } catch (e) {
      setError(e.message);
    }
  };
  const Icon = categories.find((x) => x.id === active)?.icon || BookOpen;
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="text-xl font-bold">
            CareerHub
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/applications">Applications</Link>
            <Link to="/ai-tools">AI Tools</Link>
            <Link to="/workspace/roadmap">Roadmap</Link>
            <Link to="/billing">Subscription</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Career learning
        </p>
        <h1 className="mt-1 text-3xl font-bold">Build your learning library</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Save videos, webinars, blog articles and courses you want to use.
          Resources are saved to your account; add links from providers you
          trust.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActive(category.id);
                  setError("");
                  setNotice("");
                }}
                className={`rounded-2xl border p-4 text-left transition ${active === category.id ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700" : "border-slate-200 bg-white hover:border-blue-300"}`}
              >
                <CategoryIcon className="text-blue-700" size={22} />
                <h2 className="mt-3 font-semibold">{category.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{category.hint}</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {
                    items.filter(
                      (item) =>
                        (
                          item.data?.type ||
                          item.data?.category ||
                          "video"
                        ).toLowerCase() === category.id,
                    ).length
                  }{" "}
                  saved
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={submit}
            className="h-fit rounded-2xl border bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Icon size={22} />
              </span>
              <div>
                <h2 className="font-semibold">
                  Add{" "}
                  {categories.find((x) => x.id === active)?.label.toLowerCase()}
                </h2>
                <p className="text-sm text-slate-500">
                  Save a resource to revisit later.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-medium">
              Title
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                placeholder="Resource title"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Resource URL
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                placeholder="https://..."
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Notes
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                placeholder="What do you want to learn?"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Progress
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              >
                <option>Not started</option>
                <option>In progress</option>
                <option>Completed</option>
              </select>
            </label>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {notice}
              </p>
            )}
            <button
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Plus size={16} className="mr-2 inline" />
              {saving ? "Saving…" : "Save resource"}
            </button>
          </form>
          <section className="overflow-hidden rounded-2xl border bg-white">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="font-semibold">
                  Your{" "}
                  {categories.find((x) => x.id === active)?.label.toLowerCase()}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saved resources only; no placeholder listings.
                </p>
              </div>
              <button
                onClick={load}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <RefreshCw size={14} className="mr-1 inline" />
                Refresh
              </button>
            </div>
            {busy && !items.length ? (
              <p className="p-6 text-slate-500">Loading resources…</p>
            ) : visible.length ? (
              <div className="divide-y">
                {visible.map((item) => (
                  <article key={item._id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Progress: {item.status || "Not started"}
                        </p>
                        {item.data?.url && (
                          <a
                            href={item.data.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                          >
                            Open resource <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => remove(item._id)}
                        aria-label={`Delete ${item.title}`}
                        className="rounded-lg border p-2 text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Not started", "In progress", "Completed"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => updateStatus(item, status)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${item.status === status ? "border-blue-700 bg-blue-50 text-blue-800" : "bg-white text-slate-600"}`}
                          >
                            {status}
                          </button>
                        ),
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Icon className="mx-auto text-slate-300" size={32} />
                <h3 className="mt-3 font-semibold">
                  No{" "}
                  {categories.find((x) => x.id === active)?.label.toLowerCase()}{" "}
                  saved yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first resource using the form.
                </p>
              </div>
            )}
          </section>
        </div>
        <div className="mt-6 rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Career roadmap</h2>
          <p className="mt-1 text-sm text-slate-600">
            Turn what you learn into milestones and track progress toward a
            target role.
          </p>
          <Link
            to="/workspace/roadmap"
            className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Open roadmap →
          </Link>
        </div>
      </section>
    </main>
  );
}
