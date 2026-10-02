import React from "react";
import SiteNavbar from "./SiteNavbar.jsx";

export default function SiteShell({ children }) {
  return (
    <div className="ch-app">
      <SiteNavbar />
      <div className="ch-app__content">{children}</div>
    </div>
  );
}
