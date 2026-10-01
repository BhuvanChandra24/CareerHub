import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import careerHubLogo from "../assets/careerhub.png";
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Profile() {
  const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null"); }
            catch { return null; }
              });
                const [loading, setLoading] = useState(false);
                  const [error, setError] = useState("");
                    useEffect(() => {
                        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                            if (!token) return;
                                let active = true;
                                    setLoading(true);
                                        fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
                                              .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || "Could not refresh profile.");
                                                      if (active && d.user) { setUser(d.user); (localStorage.getItem("token") ? localStorage : sessionStorage).setItem("user", JSON.stringify(d.user)); }
                                                            }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
                                                                return () => { active = false; };
                                                                  }, []);
                                                                    const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); sessionStorage.removeItem("token"); sessionStorage.removeItem("user"); navigate("/"); };
                                                                      if (!user) return <main className="min-h-screen bg-neutral-50 px-5 py-16 text-neutral-900"><div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center"><h1 className="text-2xl font-semibold">Sign in to view your profile</h1><p className="mt-3 text-sm text-neutral-600">Your account details will appear here after you sign in.</p><Link to="/login" className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm text-white">Login</Link></div></main>;
                                                                        const initials = (user.fullName || user.name || user.email || "U").split(/\s+/).map(p => p[0]).slice(0,2).join("").toUpperCase();
                                                                          return <main className="min-h-screen bg-[#f8f9fb] text-neutral-950">
                                                                              <header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/"><img src={careerHubLogo} alt="CareerHub" className="h-10 w-auto max-w-[210px] object-contain" /></Link><nav className="flex items-center gap-4 text-sm"><Link to="/jobs" className="text-neutral-600 hover:text-black">Jobs</Link><button onClick={logout} className="font-medium hover:text-blue-600">Logout</button></nav></div></header>
                                                                                  <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8"><p className="text-sm font-medium text-blue-700">YOUR CAREERHUB ACCOUNT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">My Profile</h1><p className="mt-3 text-neutral-600">Your personal account details.</p>
                                                                                        {error && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error} Showing saved details.</div>}
                                                                                              <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-4 border-b border-neutral-100 pb-6"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">{initials}</div><div><h2 className="text-xl font-semibold">{user.fullName || user.name || "CareerHub User"}</h2><p className="mt-1 text-sm text-neutral-500">{user.email || "No email saved"}</p></div></div>
                                                                                                      <div className="grid gap-5 pt-6 sm:grid-cols-2"><div className="rounded-xl bg-neutral-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Full name</p><p className="mt-2 font-medium">{user.fullName || user.name || "Not provided"}</p></div><div className="rounded-xl bg-neutral-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Email address</p><p className="mt-2 break-all font-medium">{user.email || "Not provided"}</p></div><div className="rounded-xl bg-neutral-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Account ID</p><p className="mt-2 break-all font-medium">{user.id || user._id || "Not available"}</p></div><div className="rounded-xl bg-neutral-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Profile status</p><p className="mt-2 font-medium">{loading ? "Refreshing details…" : "Account active"}</p></div></div>
                                                                                                              <div className="mt-6 flex flex-wrap gap-3"><Link to="/jobs" className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white">Explore jobs</Link><Link to="/resume-optimizer" className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium">Resume ATS</Link></div>
                                                                                                                    </div></section></main>;
                                                                                                                    }
                                                                                                                    