import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  GraduationCap,
  Trash2,
  Video,
  RefreshCw,
  Plus,
} from "lucide-react";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function api(path, options = {}) {
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
const types = [
  { id: "video", label: "Video", icon: Video },
  { id: "webinar", label: "Webinar", icon: CalendarDays },
  { id: "article", label: "Blog", icon: FileText },
  { id: "course", label: "Course", icon: GraduationCap },
];
export default function AdminContent() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    type: "video",
    summary: "",
    body: "",
    url: "",
    plan: "fresher",
    published: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setError("");
    try {
      const d = await api("/api/content/admin");
      setItems(d.items || []);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const d = await api("/api/content/admin", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setItems((x) => [d.item, ...x]);
      setForm({
        title: "",
        slug: "",
        type: "video",
        summary: "",
        body: "",
        url: "",
        plan: "fresher",
        published: true,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this learning resource?")) return;
    try {
      await api(`/api/content/admin/${id}`, { method: "DELETE" });
      setItems((x) => x.filter((i) => i._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Admin · Career Learning
            </p>
            <h1 className="text-3xl font-bold">Publish learning resources</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Upload videos, webinars, blogs and courses. Users see published
              resources and their personal learning progress.
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
        <form
          onSubmit={save}
          className="mt-6 grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2"
        >
          <div className="md:col-span-2 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <Plus size={20} />
            </span>
            <div>
              <h2 className="font-semibold">Add career learning content</h2>
              <p className="text-sm text-slate-500">
                Example: Mastering React.js Interview
              </p>
            </div>
          </div>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="rounded-xl border px-4 py-3"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug (optional)"
            className="rounded-xl border px-4 py-3"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-xl border px-4 py-3"
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="rounded-xl border px-4 py-3"
          >
            <option value="free">Free preview</option>
            <option value="fresher">Fresher subscription</option>
            <option value="experience">Experience subscription</option>
            <option value="pro">Pro subscription</option>
          </select>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Video / webinar / external resource URL"
            className="rounded-xl border px-4 py-3 md:col-span-2"
          />
          <input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Short description"
            className="rounded-xl border px-4 py-3 md:col-span-2"
          />
          <textarea
            rows="8"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Learning notes, article content, course details…"
            className="rounded-xl border px-4 py-3 md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
            />{" "}
            Publish immediately
          </label>
          <button
            disabled={saving}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white md:col-span-2"
          >
            {saving ? "Publishing…" : "Publish learning resource"}
          </button>
        </form>
        <section className="mt-7">
          <h2 className="text-xl font-bold">Published and draft resources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const T = types.find((x) => x.id === item.type)?.icon || FileText;
              return (
                <article
                  key={item._id}
                  className="rounded-2xl border bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <T size={20} />
                      </span>
                      <div>
                        <h3 className="font-bold">{item.title}</h3>
                        <p className="text-xs text-slate-500">
                          {item.type} · {item.plan} ·{" "}
                          {item.published ? "Published" : "Draft"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(item._id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  {item.summary && (
                    <p className="mt-3 text-sm text-slate-600">
                      {item.summary}
                    </p>
                  )}
                  {item.url && (
                    <p className="mt-2 truncate text-xs text-blue-700">
                      {item.url}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          {!items.length && (
            <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
              No career learning resources uploaded yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
