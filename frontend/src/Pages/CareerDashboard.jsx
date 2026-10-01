import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarClock,
  Users,
  Route,
  ArrowUpRight,
  RefreshCw,
  Building2,
  BookOpen,
  CreditCard,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqx.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function get(path) {
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Unable to load dashboard data.");
  return d;
}
const links = [
  [
    "/applications",
    "Application Tracker",
    "Track applications, interviews and offers",
    BriefcaseBusiness,
  ],
  [
    "/cover-letter",
    "AI Cover Letter",
    "Generate a role-specific cover letter",
    ArrowUpRight,
  ],
  [
    "/workspace/companies",
    "Company Database",
    "Save companies, websites and research notes",
    Building2,
  ],
  [
    "/workspace/contacts",
    "Networking CRM",
    "Keep professional contacts and interactions",
    Users,
  ],
  [
    "/workspace/activities",
    "Activity Tracker",
    "Record job-search activities and time",
    CalendarClock,
  ],
  [
    "/workspace/roadmap",
    "Career Roadmap",
    "Set milestones and track progress",
    Route,
  ],
  [
    "/learning",
    "Career Learning",
    "Organize videos, webinars, blogs and courses",
    BookOpen,
  ],
  [
    "/ai-tools",
    "AI Career Toolkit",
    "Resume AI, job matching, cover letters and interviews",
    ArrowUpRight,
  ],
  [
    "/billing",
    "Subscription & Billing",
    "View your plan and open Stripe Checkout",
    CreditCard,
  ],
];
export default function CareerDashboard() {
  const [applications, setApplications] = useState([]);
  const [workspace, setWorkspace] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, w] = await Promise.all([
        get("/api/tracker/applications"),
        get("/api/workspace/activities"),
      ]);
      setApplications(a.applications || []);
      setWorkspace(w.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const statuses = [
    "Draft",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Expired",
    "Archived",
  ];
  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user") || "{}",
      );
    } catch {
      return {};
    }
  })();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-bold">
            CareerHub
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link to="/jobs">Jobs</Link>
            <Link to="/applications">Applications</Link>
            <Link to="/ai-tools">AI Toolkit</Link>
            <Link to="/learning">Learning</Link>
            <Link to="/billing">Billing</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Career overview
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Welcome
              {user.fullName ? `, ${user.fullName.split(" ")[0]}` : " back"}
            </h1>
            <p className="mt-2 text-slate-600">
              A real-time view of your job-search activity.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border bg-white px-4 py-2"
          >
            <RefreshCw size={15} className="mr-2 inline" />
            Refresh
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total applications", applications.length, BriefcaseBusiness],
            [
              "Applied",
              applications.filter((x) => x.status === "Applied").length,
              ArrowUpRight,
            ],
            [
              "Interviews",
              applications.filter((x) => x.status === "Interview").length,
              CalendarClock,
            ],
            [
              "Offers",
              applications.filter((x) => x.status === "Offer").length,
              Route,
            ],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <Icon className="text-blue-700" size={19} />
              </div>
              <p className="mt-3 text-3xl font-bold">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Applications by status</h2>
            <div className="mt-4 space-y-4">
              {statuses.map((s) => {
                const count = applications.filter((x) => x.status === s).length;
                const width = applications.length
                  ? (count / applications.length) * 100
                  : 0;
                return (
                  <div key={s}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{s}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Recent applications</h2>
            {applications.slice(0, 5).map((x) => (
              <div key={x._id} className="border-b py-3 last:border-0">
                <p className="font-medium">{x.jobTitle}</p>
                <p className="text-sm text-slate-500">
                  {x.company} · {x.status}
                </p>
              </div>
            ))}
            {!applications.length && !loading && (
              <p className="mt-4 text-sm text-slate-500">
                No applications yet. Start tracking your job search.
              </p>
            )}
            <Link
              to="/applications"
              className="mt-4 inline-block text-sm font-semibold text-blue-700"
            >
              Open tracker →
            </Link>
          </section>
        </div>
        <h2 className="mt-8 text-xl font-bold">Career workspace</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(([href, title, desc, Icon]) => (
            <Link
              key={href}
              to={href}
              className="group rounded-2xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
            >
              <Icon className="text-blue-700" size={22} />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-blue-700">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
