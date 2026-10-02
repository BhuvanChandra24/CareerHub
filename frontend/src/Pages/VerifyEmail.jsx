import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

export default function VerifyEmail() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Verification token is missing.");
      return;
    }
    fetch(`${API}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.message || "Verification failed.");
        setState("success");
        setMessage(d.message);
      })
      .catch((e) => {
        setState("error");
        setMessage(e.message);
      });
  }, [token]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-blue-700">
          CAREERHUB SECURITY
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {state === "loading"
            ? "Verifying…"
            : state === "success"
              ? "Email verified"
              : "Verification failed"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Continue to CareerHub
        </Link>
      </section>
    </main>
  );
}
