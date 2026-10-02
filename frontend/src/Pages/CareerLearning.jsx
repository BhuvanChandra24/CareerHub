import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Video,
  CalendarDays,
  FileText,
  GraduationCap,
  Lock,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const categories = [
  {
    id: "video",
    label: "Videos",
    hint: "Tutorials, recorded lessons and technical walkthroughs",
    icon: Video,
  },
  {
    id: "webinar",
    label: "Webinars",
    hint: "Live sessions, workshops and event recordings",
    icon: CalendarDays,
  },
  {
    id: "article",
    label: "Blogs",
    hint: "Articles, guides and career insights",
    icon: FileText,
  },
  {
    id: "course",
    label: "Courses",
    hint: "Structured courses and learning paths",
    icon: GraduationCap,
  },
];
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
  if (!r.ok) {
    const e = new Error(d.message || `Request failed (${r.status})`);
    e.code = d.code;
    throw e;
  }
  return d;
}
function YouTubeEmbed({ url, title }) {
  try {
    const u = new URL(url);
    let id = u.searchParams.get("v");
    if (!id && u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    if (!id) return null;
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  } catch {
    return null;
  }
}
export default function CareerLearning() {
  const navigate = useNavigate();
  const [active, setActive] = useState("video");
  const [items, setItems] = useState([]);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api("/api/content");
      setItems(d.items || []);
      setPlan(d.plan || "free");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const visible = useMemo(
    () => items.filter((x) => (x.type || "article") === active),
    [items, active],
  );
  const open = async (item) => {
    setNotice("");
    setError("");
    if (item.locked) {
      navigate("/billing");
      return;
    }
    try {
      const d = await api(`/api/content/${item._id}`);
      setSelected(d.item);
      setProgress(
        d.progress || { percent: 0, positionSeconds: 0, completed: false },
      );
    } catch (e) {
      if (e.code === "SUBSCRIPTION_REQUIRED") {
        setNotice("This learning resource requires a subscription.");
        navigate("/billing");
      } else setError(e.message);
    }
  };
  const saveProgress = async (percent, positionSeconds = 0) => {
    if (!selected) return;
    try {
      const d = await api(`/api/content/${selected._id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          percent,
          positionSeconds,
          completed: percent >= 90,
        }),
      });
      setProgress(d.progress);
    } catch (e) {
      setError(e.message);
    }
  };
  const title = categories.find((x) => x.id === active)?.label || "Learning";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Career learning
            </p>
            <h1 className="mt-1 text-3xl font-bold">Learn from CareerHub</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Admin-published videos, webinars, blogs and courses. Your progress
              is saved to your account.
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
        {plan !== "free" && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            {plan} subscription active — subscriber learning is unlocked.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {notice}
          </div>
        )}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const I = c.icon;
            const count = items.filter(
              (x) => (x.type || "article") === c.id,
            ).length;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  setSelected(null);
                }}
                className={`rounded-2xl border p-5 text-left ${active === c.id ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700" : "border-slate-200 bg-white hover:border-blue-300"}`}
              >
                <I className="text-blue-700" size={24} />
                <h2 className="mt-3 font-semibold">{c.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{c.hint}</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {count} published
                </p>
              </button>
            );
          })}
        </div>
        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-slate-500">
                {visible.length
                  ? `${visible.length} resource${visible.length === 1 ? "" : "s"}`
                  : "No resources yet"}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="rounded-2xl border bg-white p-8 text-slate-500">
              Loading learning library…
            </div>
          ) : visible.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => {
                const p = item.progress || {};
                return (
                  <article
                    key={item._id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <div className="h-40 bg-slate-100">
                      {item.type === "video" && item.url ? (
                        <YouTubeEmbed url={item.url} title={item.title} />
                      ) : (
                        <div className="grid h-full place-items-center">
                          {item.locked ? (
                            <Lock className="text-slate-400" size={36} />
                          ) : (
                            <BookOpen className="text-blue-300" size={42} />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            {item.type}
                          </p>
                          <h3 className="mt-1 font-bold">{item.title}</h3>
                        </div>
                        {item.locked ? (
                          <Lock size={18} className="text-slate-400" />
                        ) : p.completed ? (
                          <CheckCircle2 size={19} className="text-green-600" />
                        ) : (
                          <PlayCircle size={19} className="text-blue-600" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {item.summary ||
                          item.body ||
                          "Career learning resource"}
                      </p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>
                            {item.locked
                              ? "Subscription required"
                              : `${p.percent || 0}% complete`}
                          </span>
                          {item.plan !== "free" && <span>{item.plan}+</span>}
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${item.locked ? 0 : p.percent || 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => open(item)}
                        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${item.locked ? "border bg-white text-slate-700" : "bg-blue-700 text-white"}`}
                      >
                        {item.locked ? "View subscription" : "Start learning"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
              <BookOpen className="mx-auto text-slate-300" size={38} />
              <h3 className="mt-3 font-semibold">
                No {title.toLowerCase()} available
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Admin has not uploaded any {title.toLowerCase()} yet.
              </p>
            </div>
          )}
        </section>
        {selected && (
          <section className="mt-7 rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Now learning
                </p>
                <h2 className="mt-1 text-2xl font-bold">{selected.title}</h2>
                <p className="mt-2 text-slate-600">{selected.summary}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>
            {selected.type === "video" && selected.url && (
              <div className="mt-5">
                <YouTubeEmbed url={selected.url} title={selected.title} />
                <div className="mt-4 flex items-center gap-3">
                  <input
                    aria-label="Video progress"
                    type="range"
                    min="0"
                    max="100"
                    value={progress?.percent || 0}
                    onChange={(e) => saveProgress(Number(e.target.value), 0)}
                    className="w-full"
                  />
                  <span className="w-12 text-right text-sm font-semibold">
                    {progress?.percent || 0}%
                  </span>
                </div>
              </div>
            )}
            {selected.type !== "video" && selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open resource <ExternalLink size={15} />
              </a>
            )}
            <div className="prose mt-6 max-w-none whitespace-pre-wrap text-slate-700">
              {selected.body || ""}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => saveProgress(100, 0)}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Mark completed
              </button>
              <span className="text-sm text-slate-500">
                <Clock3 size={15} className="mr-1 inline" />
                Progress is saved automatically.
              </span>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
