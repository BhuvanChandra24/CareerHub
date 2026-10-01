import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import careerHubLogo from "../assets/careerhub.png";

export default function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!token || !savedUser)
      return () => {
        active = false;
      };
    const apiUrl = (
      import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
    ).replace(/\/$/, "");
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user) throw new Error("Session expired.");
        if (!active) return;
        (localStorage.getItem("token") ? localStorage : sessionStorage).setItem(
          "user",
          JSON.stringify(data.user),
        );
        const requestedRedirect = new URLSearchParams(
          window.location.search,
        ).get("redirect");
        const safeRedirect =
          requestedRedirect &&
          requestedRedirect.startsWith("/") &&
          !requestedRedirect.startsWith("//")
            ? requestedRedirect
            : "/dashboard";
        navigate(safeRedirect, { replace: true });
      })
      .catch(() => {
        if (active)
          [localStorage, sessionStorage].forEach((store) => {
            store.removeItem("token");
            store.removeItem("user");
          });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const apiUrl = (
        import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
      ).replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to sign in.");
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));
      const requestedRedirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      const safeRedirect =
        requestedRedirect &&
        requestedRedirect.startsWith("/") &&
        !requestedRedirect.startsWith("//")
          ? requestedRedirect
          : "/jobs";
      navigate(safeRedirect, { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to CareerHub. Check that the backend is running.",
      );
    } finally {
      setSubmitting(false);
    }
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
          New to CareerHub?{" "}
          <Link
            to={`/signup${window.location.search}`}
            className="font-semibold text-black underline underline-offset-4"
          >
            Create account
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
              YOUR CAREER. YOUR DIRECTION.
            </span>
          </div>

          <div className="relative max-w-xl">
            <p className="text-sm text-neutral-400">
              WELCOME BACK TO CAREERHUB
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.12] tracking-[-0.05em] xl:text-6xl">
              Your next move
              <span className="block text-neutral-500">starts here.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-neutral-400">
              Pick up where you left off. Discover opportunities, track
              applications, and keep building the career you want.
            </p>

            <div className="mt-12 space-y-4">
              {[
                "Keep your applications organized",
                "Prepare for your next interview",
                "Make progress toward your career goals",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-xs">
                    0{index + 1}
                  </span>
                  <span className="text-sm text-neutral-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-neutral-500">
            Where your next begins.
          </p>
        </div>

        {/* SIGN-IN FORM */}
        <div className="flex items-center justify-center px-5 py-14 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-9 lg:hidden">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                YOUR NEXT CHAPTER
              </span>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-neutral-500">
                YOUR WORKSPACE AWAITS
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                Welcome back.
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Sign in to continue your career journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs text-neutral-500 transition hover:text-black"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 pr-16 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-neutral-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 text-xs font-medium text-neutral-500 hover:text-black"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 accent-black"
                />
                <span className="text-sm text-neutral-600">Remember me</span>
              </label>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"} <span>↗</span>
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">
                YOUR CAREER STARTS HERE
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{" "}
              <Link
                to={`/signup${window.location.search}`}
                className="font-semibold text-black underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>

            <p className="mt-10 text-center text-xs leading-6 text-neutral-400">
              By signing in, you agree to CareerHub's{" "}
              <Link to="/terms" className="underline hover:text-black">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-black">
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-7 w-full text-center text-sm text-neutral-500 transition hover:text-black"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
