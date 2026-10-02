import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function request(path, options = {}) {
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

const fallbackPlans = [
  {
    id: "free",
    name: "Free",
    description: "Core career workspace.",
    limits: {
      resumeAnalysis: 2,
      coverLetters: 2,
      mockInterviews: 2,
      careerAssistant: 10,
      resumes: 2,
    },
  },
  {
    id: "fresher",
    name: "Fresher",
    description: "Higher AI limits for students and freshers.",
    limits: {
      resumeAnalysis: 10,
      coverLetters: 10,
      mockInterviews: 10,
      careerAssistant: 50,
      resumes: 5,
    },
  },
  {
    id: "experience",
    name: "Experience",
    description: "Higher limits for experienced professionals.",
    limits: {
      resumeAnalysis: 30,
      coverLetters: 30,
      mockInterviews: 30,
      careerAssistant: 150,
      resumes: 15,
    },
  },
];

export default function Billing() {
  const location = useLocation(),
    navigate = useNavigate();
  const [subscription, setSubscription] = useState({
    status: "free",
    plan: "free",
    usage: {},
    limits: {},
  });
  const [plans, setPlans] = useState(fallbackPlans),
    [loading, setLoading] = useState(true),
    [checkout, setCheckout] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, p] = await Promise.all([
        request("/api/billing/status"),
        request("/api/billing/plans"),
      ]);
      setSubscription(s.subscription || {});
      if (p.plans?.length) setPlans(p.plans);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const status = new URLSearchParams(location.search).get("checkout");
    if (status === "success")
      setNotice(
        "Checkout returned successfully. Stripe webhook will update the plan.",
      );
    if (status === "cancelled") setNotice("Checkout cancelled.");
    load();
  }, [load, location.search]);
  const startCheckout = async (plan) => {
    setCheckout(plan);
    setError("");
    try {
      const d = await request("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      if (!d.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(d.url);
    } catch (e) {
      setError(e.message);
      setCheckout("");
    }
  };
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Subscription SaaS
        </p>
        <h1 className="mt-1 text-3xl font-bold">Plans & billing</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose a plan and use AI features within a clear monthly limit.
        </p>
        {notice && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-white p-6 ${subscription.plan === plan.id ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                {subscription.plan === plan.id && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {Object.entries(plan.limits || {}).map(([k, v]) => (
                  <li key={k} className="flex gap-2">
                    <Check size={16} className="mt-0.5 text-green-600" />
                    {k
                      .replace(/[A-Z]/g, (m) => ` ${m}`)
                      .replace(/^./, (m) => m.toUpperCase())}
                    : {v}/month
                  </li>
                ))}
              </ul>
              {plan.id === "free" ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mt-6 w-full rounded-xl border px-4 py-3 font-semibold"
                >
                  {subscription.plan === "free"
                    ? "Current plan"
                    : "Open dashboard"}
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={
                    checkout === plan.id ||
                    (subscription.plan === plan.id &&
                      subscription.status === "active")
                  }
                  className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <CreditCard size={16} className="mr-2 inline" />
                  {checkout === plan.id
                    ? "Opening checkout…"
                    : subscription.plan === plan.id &&
                        subscription.status === "active"
                      ? "Active"
                      : "Continue to Stripe"}
                </button>
              )}
            </article>
          ))}
        </div>
        <section className="mt-6 rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-700" size={24} />
              <div>
                <h2 className="font-semibold">Current usage</h2>
                <p className="text-sm text-slate-500">
                  Limits reset each calendar month.
                </p>
              </div>
            </div>
            <button
              onClick={load}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <RefreshCw size={14} className="mr-1 inline" />
              Refresh
            </button>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Information access
            </p>
            <p className="mt-1 font-semibold">
              {subscription.plan === "free"
                ? `${subscription.infoUsage || 0} / 5 this month`
                : "Unlimited under subscription"}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(subscription.limits || {}).map(([k, limit]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {k.replace(/[A-Z]/g, " $&")}
                </p>
                <p className="mt-1 font-semibold">
                  {loading ? "…" : `${subscription.usage?.[k] || 0} / ${limit}`}
                </p>
              </div>
            ))}
          </div>
        </section>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          For paid plans, configure STRIPE_PRICE_ID_FRESHER and
          STRIPE_PRICE_ID_EXPERIENCE plus Stripe webhook settings on the
          backend.
        </p>
      </section>
    </main>
  );
}
