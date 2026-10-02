import React, { useState } from "react";
import { Link } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setPreview("");
    try {
      const r = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "Unable to create reset link.");
      setMessage(d.message);
      if (d.resetPreview) setPreview(d.resetPreview);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm"
      >
        <p className="text-sm font-semibold text-blue-700">ACCOUNT SECURITY</p>
        <h1 className="mt-2 text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your account email and we will send a secure reset link.
        </p>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {preview && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs break-all text-amber-900">
            Development preview:{" "}
            <a className="underline" href={preview}>
              {preview}
            </a>
          </div>
        )}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-6 w-full rounded-xl border px-4 py-3"
        />
        <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
          Send reset link
        </button>
        <Link
          to="/login"
          className="mt-5 block text-center text-sm font-semibold text-blue-700"
        >
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
