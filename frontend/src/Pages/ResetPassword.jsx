import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8)
      return setError("Password must contain at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      const r = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "Unable to reset password.");
      setMessage(d.message);
      setTimeout(() => navigate("/login"), 900);
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
        <h1 className="mt-2 text-3xl font-bold">Choose a new password</h1>
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
        <input
          required
          minLength={8}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="mt-6 w-full rounded-xl border px-4 py-3"
        />
        <input
          required
          minLength={8}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="mt-3 w-full rounded-xl border px-4 py-3"
        />
        <button className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white">
          Reset password
        </button>
        <Link
          to="/login"
          className="mt-5 block text-center text-sm text-blue-700"
        >
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
