import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BriefcaseBusiness,
  BookOpen,
  Activity,
  CreditCard,
  Video,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function get(path) {
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Unable to load admin data.");
  return d;
}
const Card = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border bg-white p-5">
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <Icon size={19} className="text-blue-700" />
    </div>
    <p className="mt-3 text-3xl font-bold">{value}</p>
  </div>
);
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await get("/api/admin/overview"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              CareerHub Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold">Platform overview</h1>
            <p className="mt-2 text-slate-600">
              Users, applications, subscriptions, learning content, progress and
              website usage.
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
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="mt-6 rounded-2xl border bg-white p-10 text-slate-500">
            Loading admin overview…
          </div>
        ) : (
          data && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card icon={Users} label="Users" value={data.counts.users} />
                <Card
                  icon={BriefcaseBusiness}
                  label="Applications"
                  value={
                    data.counts.applications + data.counts.trackedApplications
                  }
                />
                <Card
                  icon={BookOpen}
                  label="Learning resources"
                  value={data.counts.content}
                />
                <Card
                  icon={Activity}
                  label="Learning progress records"
                  value={data.counts.learningProgress}
                />
                <Card
                  icon={Activity}
                  label="Usage events"
                  value={data.counts.usageEvents}
                />
                <Card
                  icon={CreditCard}
                  label="Paid plans"
                  value={
                    (data.plans.fresher || 0) +
                    (data.plans.experience || 0) +
                    (data.plans.pro || 0)
                  }
                />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">Subscription plans</h2>
                  <div className="mt-4 space-y-3">
                    {Object.entries(data.plans).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <span className="capitalize">{k}</span>
                        <b>{v}</b>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">Career learning</h2>
                  <div className="mt-4 space-y-3">
                    {Object.entries(data.contentByType).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <span className="capitalize">{k}</span>
                        <span>
                          {v.published}/{v.count} published
                        </span>
                      </div>
                    ))}
                    {!Object.keys(data.contentByType).length && (
                      <p className="text-sm text-slate-500">No content yet.</p>
                    )}
                  </div>
                  <Link
                    to="/admin/content"
                    className="mt-4 inline-block rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Manage videos & learning
                  </Link>
                </section>
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">Application statuses</h2>
                  <div className="mt-4 space-y-3">
                    {Object.entries(data.applicationStatuses).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <span className="capitalize">{k}</span>
                        <b>{v}</b>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">Recent learning progress</h2>
                  <div className="mt-4 space-y-3">
                    {(data.recentProgress || []).map((p) => (
                      <div key={p._id} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <b>{p.content?.title || "Learning resource"}</b>
                            <p className="text-xs text-slate-500">
                              {p.user?.fullName || p.user?.email || "User"} ·{" "}
                              {p.content?.type || "content"}
                            </p>
                          </div>
                          <span className="font-semibold">
                            {p.percent || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {!(data.recentProgress || []).length && (
                      <p className="text-sm text-slate-500">
                        No learning progress recorded yet.
                      </p>
                    )}
                  </div>
                </section>
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">Recent website usage</h2>
                  <div className="mt-4 space-y-3">
                    {(data.recentUsage || []).slice(0, 10).map((e) => (
                      <div key={e._id} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <b>{e.feature}</b>
                            <p className="text-xs text-slate-500">
                              {e.user?.fullName || e.user?.email || "User"} ·{" "}
                              {e.path}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {Math.round((e.durationSeconds || 0) / 60)} min
                          </span>
                        </div>
                      </div>
                    ))}
                    {!(data.recentUsage || []).length && (
                      <p className="text-sm text-slate-500">
                        No usage events recorded yet.
                      </p>
                    )}
                  </div>
                </section>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Recent users</h2>
                    <ShieldCheck size={19} className="text-blue-700" />
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-slate-500">
                          <th className="py-2">User</th>
                          <th>Role</th>
                          <th>Plan</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentUsers.map((u) => (
                          <tr key={u._id} className="border-b last:border-0">
                            <td className="py-3">
                              <b>{u.fullName}</b>
                              <div className="text-xs text-slate-500">
                                {u.email}
                              </div>
                            </td>
                            <td>{u.role}</td>
                            <td>{u.subscriptionPlan || "free"}</td>
                            <td>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="font-semibold">
                    Recent submitted applications
                  </h2>
                  <div className="mt-4 space-y-3">
                    {data.recentApplications.map((a) => (
                      <div key={a._id} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <b>{a.jobTitle}</b>
                            <p className="text-xs text-slate-500">
                              {a.company} · {a.email}
                            </p>
                          </div>
                          <span className="text-xs font-semibold capitalize">
                            {a.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!data.recentApplications.length && (
                      <p className="text-sm text-slate-500">
                        No applications yet.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )
        )}
      </section>
    </main>
  );
}
