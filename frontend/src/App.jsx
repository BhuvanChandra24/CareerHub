import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import SignIn from "./Pages/SignIn.jsx";
import SignUp from "./Pages/SignUp.jsx";
import Jobs from "./Pages/Jobs.jsx";
import ResumeATS from "./Pages/ResumeATS.jsx";
import ResumeJobs from "./Pages/ResumeJobs.jsx";
import Profile from "./Pages/Profile.jsx";
import AIToolkit from "./components/AIToolkit.jsx";
import ApplicationsTracker from "./Pages/ApplicationsTracker.jsx";
import CareerDashboard from "./Pages/CareerDashboard.jsx";
import CoverLetter from "./Pages/CoverLetter.jsx";
import CareerWorkspace from "./Pages/CareerWorkspace.jsx";
import CareerLearning from "./Pages/CareerLearning.jsx";
import Billing from "./Pages/Billing.jsx";
import InfoPage from "./Pages/InfoPage.jsx";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const readSession = () => ({
  token: localStorage.getItem("token") || sessionStorage.getItem("token") || "",
  user: localStorage.getItem("user") || sessionStorage.getItem("user") || "",
});
const clearSession = () => {
  [localStorage, sessionStorage].forEach((store) => {
    store.removeItem("token");
    store.removeItem("user");
  });
};

function RequireAuth({ children }) {
  const location = useLocation();
  const [state, setState] = useState("checking");
  useEffect(() => {
    let active = true;
    const session = readSession();
    if (!session.token || !session.user) {
      setState("signed-out");
      return () => { active = false; };
    }
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user) throw new Error(data.message || "Session expired.");
        if (active) {
          const store = localStorage.getItem("token") ? localStorage : sessionStorage;
          store.setItem("user", JSON.stringify(data.user));
          setState("signed-in");
        }
      })
      .catch(() => {
        clearSession();
        if (active) setState("signed-out");
      });
    return () => { active = false; };
  }, []);
  if (state === "checking") return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Checking your CareerHub session…</main>;
  if (state !== "signed-in") {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/resume-optimizer" element={<ResumeATS />} />
        <Route path="/resume-jobs" element={<ResumeJobs />} />
        <Route path="/ai-tools" element={<RequireAuth><AIToolkit /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><CareerDashboard /></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><ApplicationsTracker /></RequireAuth>} />
        <Route path="/cover-letter" element={<RequireAuth><CoverLetter /></RequireAuth>} />
        <Route path="/learning" element={<RequireAuth><CareerLearning /></RequireAuth>} />
        <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
        <Route path="/terms" element={<InfoPage />} />
        <Route path="/privacy" element={<InfoPage />} />
        <Route path="/forgot-password" element={<InfoPage />} />
        <Route path="/workspace/:section" element={<RequireAuth><CareerWorkspace /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
