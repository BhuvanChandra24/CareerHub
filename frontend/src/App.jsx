import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import Companies from "./Pages/Companies.jsx";
import JobsCRM from "./Pages/JobsCRM.jsx";
import ForgotPassword from "./Pages/ForgotPassword.jsx";
import ResetPassword from "./Pages/ResetPassword.jsx";
import VerifyEmail from "./Pages/VerifyEmail.jsx";
import ResumeManager from "./Pages/ResumeManager.jsx";
import AdminContent from "./Pages/AdminContent.jsx";
import SiteShell from "./components/SiteShell.jsx";

const API_BASE = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com/"
).replace(/\/$/, "");
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
      return () => {
        active = false;
      };
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user)
          throw new Error(data.message || "Session expired.");
        if (active) {
          const store = localStorage.getItem("token")
            ? localStorage
            : sessionStorage;
          store.setItem("user", JSON.stringify(data.user));
          setState("signed-in");
        }
      })
      .catch(() => {
        clearSession();
        if (active) setState("signed-out");
      });
    return () => {
      active = false;
    };
  }, []);
  if (state === "checking")
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        Checking your CareerHub session…
      </main>
    );
  if (state !== "signed-in") {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
        state={{ from: location }}
      />
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <SiteShell>
              <SignIn />
            </SiteShell>
          }
        />
        <Route
          path="/signup"
          element={
            <SiteShell>
              <SignUp />
            </SiteShell>
          }
        />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route
          path="/profile"
          element={
            <SiteShell>
              <Profile />
            </SiteShell>
          }
        />
        <Route
          path="/jobs-hub"
          element={
            <SiteShell>
              <JobsCRM />
            </SiteShell>
          }
        />
        <Route
          path="/jobs"
          element={
            <SiteShell>
              <Jobs />
            </SiteShell>
          }
        />
        <Route
          path="/companies"
          element={
            <SiteShell>
              <RequireAuth>
                <Companies />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/resume-optimizer"
          element={
            <SiteShell>
              <ResumeATS />
            </SiteShell>
          }
        />
        <Route
          path="/resume-jobs"
          element={
            <SiteShell>
              <ResumeJobs />
            </SiteShell>
          }
        />
        <Route
          path="/ai-tools"
          element={
            <SiteShell>
              <RequireAuth>
                <AIToolkit />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/dashboard"
          element={
            <SiteShell>
              <RequireAuth>
                <CareerDashboard />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/applications"
          element={
            <SiteShell>
              <RequireAuth>
                <ApplicationsTracker />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <SiteShell>
              <RequireAuth>
                <CoverLetter />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/learning"
          element={
            <SiteShell>
              <RequireAuth>
                <CareerLearning />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/billing"
          element={
            <SiteShell>
              <RequireAuth>
                <Billing />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/terms"
          element={
            <SiteShell>
              <InfoPage />
            </SiteShell>
          }
        />
        <Route
          path="/privacy"
          element={
            <SiteShell>
              <InfoPage />
            </SiteShell>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/resumes"
          element={
            <SiteShell>
              <RequireAuth>
                <ResumeManager />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/admin/content"
          element={
            <SiteShell>
              <RequireAuth>
                <AdminContent />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route
          path="/workspace/:section"
          element={
            <SiteShell>
              <RequireAuth>
                <CareerWorkspace />
              </RequireAuth>
            </SiteShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
