import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import careerHubLogo from "../assets/careerhub.png";

export default function SignUp() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.agreeToTerms) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    setError("");
    const apiUrl = (
      import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com/"
    ).replace(/\/$/, "");
    fetch(`${apiUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.message || "Unable to create account.");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        const requestedRedirect = new URLSearchParams(
          window.location.search,
        ).get("redirect");
        const safeRedirect =
          requestedRedirect &&
          requestedRedirect.startsWith("/") &&
          !requestedRedirect.startsWith("//")
            ? requestedRedirect
            : "/jobs";
        navigate(safeRedirect, { replace: true });
      })
      .catch((err) =>
        setError(err.message || "Unable to connect to CareerHub backend."),
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="flex h-20 items-center justify-between border-b border-neutral-200 px-5 sm:px-10 lg:px-16">
        <Link to="/" aria-label="CareerHub home">
          <img
            src={careerHubLogo}
            alt="CareerHub"
            className="h-11 w-auto max-w-[200px] object-contain"
          />
        </Link>

        <div className="text-sm text-neutral-600">
          Already a member?{" "}
          <Link
            to="/login"
            className="font-semibold text-black underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-80px)] lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="relative hidden overflow-hidden bg-neutral-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full border border-neutral-700" />
          <div className="absolute -right-16 -top-8 h-64 w-64 rounded-full border border-neutral-700" />

          <div className="relative">
            <span className="rounded-full border border-neutral-700 px-4 py-2 text-xs tracking-widest text-neutral-300">
              A NEW CHAPTER BEGINS
            </span>
          </div>

          <div className="relative max-w-xl">
            <p className="text-sm text-neutral-400">WELCOME TO CAREERHUB</p>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.12] tracking-[-0.05em] xl:text-6xl">
              Your ambition.
              <span className="block text-neutral-500">Your next move.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-neutral-400">
              Bring your job search, resume, interview preparation, and career
              goals together in one focused workspace.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-3">
              {[
                ["01", "Discover jobs"],
                ["02", "Improve your resume"],
                ["03", "Prepare for interviews"],
                ["04", "Track your progress"],
              ].map(([number, title]) => (
                <div
                  key={number}
                  className="rounded-xl border border-neutral-800 bg-white/[0.03] p-4"
                >
                  <p className="text-xs text-neutral-500">{number}</p>
                  <p className="mt-3 text-sm font-medium">{title}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-neutral-500">
            Where your next begins.
          </p>
        </div>

        {/* SIGN-UP FORM */}
        <div className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-medium text-neutral-500">
                START YOUR JOURNEY
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                Create your account.
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Set up your workspace and take the next step in your career.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 pr-16 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 text-xs font-medium text-neutral-500 hover:text-black"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-neutral-400">
                  Use at least 8 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 pr-16 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-4 text-xs font-medium text-neutral-500 hover:text-black"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={form.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 shrink-0 accent-black"
                />

                <span className="text-xs leading-6 text-neutral-600">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-medium text-black underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-medium text-black underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                disabled={submitting}
              >
                {submitting ? "Creating account..." : "Create account"}{" "}
                <span>↗</span>
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">
                YOUR NEXT CHAPTER
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <p className="text-center text-sm text-neutral-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-black underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-8 w-full text-center text-sm text-neutral-500 transition hover:text-black"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
