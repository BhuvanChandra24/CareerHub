import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqx.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function request(path, options = {}) {
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
export default function Billing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState({
    status: "free",
    plan: "free",
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/billing/status");
      setSubscription(data.subscription || { status: "free", plan: "free" });
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
        "Checkout completed or returned successfully. Your subscription status will update after Stripe sends its webhook.",
      );
    if (status === "cancelled")
      setNotice("Checkout was cancelled. No subscription change was made.");
    load();
  }, [load, location.search]);
  const startCheckout = async () => {
    setCheckout(true);
    setError("");
    setNotice("");
    try {
      const data = await request("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "pro" }),
      });
      if (!data.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e.message);
      setCheckout(false);
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
          Manage your CareerHub plan. Checkout uses Stripe when your backend has
          a Stripe secret key and a valid recurring price ID configured.
        </p>
        {notice && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <article
            className={`rounded-2xl border bg-white p-6 ${subscription.plan === "free" ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Free</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                Starter
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              ₹0{" "}
              <span className="text-sm font-normal text-slate-500">
                / forever
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Start organizing your career search.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                "Job CRM and application tracking",
                "Company and contact records",
                "Career roadmap and learning library",
                "CareerHub workspace",
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <Check className="shrink-0 text-green-600" size={17} />
                  {x}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-7 w-full rounded-xl border px-4 py-3 font-semibold"
            >
              {subscription.plan === "free"
                ? "Current plan"
                : "Back to dashboard"}
            </button>
          </article>
          <article
            className={`rounded-2xl border bg-white p-6 ${subscription.plan === "pro" ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">CareerHub Pro</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Subscription
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              Stripe price{" "}
              <span className="text-sm font-normal text-slate-500">
                configured in billing
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              A paid subscription managed securely through Stripe Checkout.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                "AI career assistant and interview practice",
                "Resume analysis and job matching",
                "AI cover letters and professional branding",
                "Secure recurring billing through Stripe",
              ].map((x) => (
                <li key={x} className="flex gap-2">
                  <Check className="shrink-0 text-green-600" size={17} />
                  {x}
                </li>
              ))}
            </ul>
            <button
              onClick={startCheckout}
              disabled={checkout || subscription.status === "active"}
              className="mt-7 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard size={17} className="mr-2 inline" />
              {checkout
                ? "Opening secure checkout…"
                : subscription.status === "active"
                  ? "Pro subscription active"
                  : "Continue to Stripe Checkout"}
            </button>
          </article>
        </div>
        <section className="mt-6 rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-700" size={24} />
              <div>
                <h2 className="font-semibold">Current subscription status</h2>
                <p className="text-sm text-slate-500">
                  Status is refreshed from your signed-in account.
                </p>
              </div>
            </div>
            <button
              onClick={load}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <RefreshCw size={14} className="mr-1 inline" />
              Refresh status
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Plan
              </p>
              <p className="mt-1 font-semibold">
                {loading
                  ? "Loading…"
                  : (subscription.plan || "free").toUpperCase()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1 font-semibold">
                {loading ? "Loading…" : subscription.status}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Period ends
              </p>
              <p className="mt-1 font-semibold">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
          </div>
        </section>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Before accepting live payments, configure Stripe test/live keys, a
          recurring Pro Price ID, and the webhook endpoint{" "}
          <code>/api/billing/webhook</code> in Stripe Dashboard. Test checkout
          and webhook events before production.
        </p>
      </section>
    </main>
  );
}
