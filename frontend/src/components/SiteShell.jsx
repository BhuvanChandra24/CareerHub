import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SiteNavbar from "./SiteNavbar.jsx";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

export default function SiteShell({ children }) {
  const location = useLocation();
  useEffect(() => {
    const started = Date.now();
    return () => {
      const t = token();
      const duration = Math.max(1, Math.round((Date.now() - started) / 1000));
      if (!t) return;
      fetch(`${API}/api/usage/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          feature: location.pathname.split("/")[1] || "Home",
          path: location.pathname,
          action: "page_view",
          durationSeconds: duration,
          startedAt: new Date(started).toISOString(),
          endedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    };
  }, [location.pathname]);
  return (
    <div className="ch-app">
      <SiteNavbar />
      <div className="ch-app__content">{children}</div>
    </div>
  );
}
