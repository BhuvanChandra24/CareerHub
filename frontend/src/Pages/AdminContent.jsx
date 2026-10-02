import React, { useEffect, useState } from "react";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function api(path, options = {}) {
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
export default function AdminContent() {
  const [items, setItems] = useState([]),
    [form, setForm] = useState({
      title: "",
      slug: "",
      type: "article",
      summary: "",
      body: "",
      plan: "free",
      published: false,
    }),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setItems((await api("/api/content/admin")).items || []);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    try {
      const d = await api("/api/content/admin", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setItems((x) => [d.item, ...x]);
      setForm({
        title: "",
        slug: "",
        type: "article",
        summary: "",
        body: "",
        plan: "free",
        published: false,
      });
    } catch (e) {
      setError(e.message);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete content?")) return;
    try {
      await api(`/api/content/admin/${id}`, { method: "DELETE" });
      setItems((x) => x.filter((i) => i._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-blue-700">ADMIN</p>
        <h1 className="text-3xl font-bold">Content management</h1>
        <p className="mt-2 text-slate-600">
          Create and publish structured career content with plan access.
        </p>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <form
          onSubmit={save}
          className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"
        >
          {["title", "slug", "summary"].map((k) => (
            <input
              key={k}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={k}
              className="rounded-xl border px-4 py-3"
            />
          ))}
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-xl border px-4 py-3"
          >
            <option>article</option>
            <option>video</option>
            <option>course</option>
            <option>webinar</option>
          </select>
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="rounded-xl border px-4 py-3"
          >
            <option>free</option>
            <option>fresher</option>
            <option>experience</option>
            <option>pro</option>
          </select>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Rich content / Markdown / HTML"
            rows="8"
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
            Publish now
          </label>
          <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
            Create content
          </button>
        </form>
        <section className="mt-6 space-y-3">
          {items.map((i) => (
            <article
              key={i._id}
              className="rounded-2xl border bg-white p-5 flex items-start justify-between gap-4"
            >
              <div>
                <h2 className="font-bold">{i.title}</h2>
                <p className="text-sm text-slate-500">
                  {i.type} · {i.plan} · {i.published ? "Published" : "Draft"}
                </p>
                <p className="mt-2 text-sm text-slate-600">{i.summary}</p>
              </div>
              <button
                onClick={() => remove(i._id)}
                className="text-sm text-red-600"
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
