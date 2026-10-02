import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import careerHubLogo from "../assets/careerhub.png";

const getStoredUser = () => {
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return token && raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const navItems = [
  { label: "Home", to: "/", exact: true },
  { label: "Jobs", to: "/jobs" },
  { label: "AI Tools", to: "/ai-tools", protected: true },
  { label: "Career Learning", to: "/learning", protected: true },
  { label: "Dashboard", to: "/dashboard", protected: true },
];

export default function SiteNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    setUser(getStoredUser());
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener("storage", sync);
    window.addEventListener("careerhub-auth-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("careerhub-auth-change", sync);
    };
  }, []);

  const initials = useMemo(() => {
    const value = user?.fullName || user?.name || user?.email || "U";
    return value.trim().charAt(0).toUpperCase() || "U";
  }, [user]);

  const displayName = user?.fullName || user?.name || "My Profile";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("careerhub-auth-change"));
    navigate("/");
  };

  const openProtected = (event, item) => {
    if (!item.protected) return;
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      event.preventDefault();
      navigate(`/login?redirect=${encodeURIComponent(item.to)}`);
    }
  };

  return (
    <header className="ch-navbar">
      <div className="ch-navbar__inner">
        <Link to="/" className="ch-navbar__brand" aria-label="CareerHub home">
          <img src={careerHubLogo} alt="CareerHub" />
        </Link>

        <nav className="ch-navbar__links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.exact}
              onClick={(event) => openProtected(event, item)}
              className={({ isActive }) =>
                `ch-navbar__link ${isActive ? "is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ch-navbar__actions">
          {user ? (
            <>
              <Link to="/profile" className="ch-navbar__profile">
                <span className="ch-navbar__avatar">{initials}</span>
                <span className="ch-navbar__name">{displayName}</span>
              </Link>
              <button
                type="button"
                className="ch-navbar__logout"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ch-navbar__login">
                Login
              </Link>
              <Link to="/signup" className="ch-navbar__cta">
                Get Started <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ch-navbar__menu"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {menuOpen && (
        <div className="ch-navbar__mobile">
          <nav aria-label="Mobile navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.exact}
                onClick={(event) => {
                  openProtected(event, item);
                  if (!event.defaultPrevented) setMenuOpen(false);
                }}
                className={({ isActive }) =>
                  `ch-navbar__mobile-link ${isActive ? "is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ch-navbar__mobile-actions">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="ch-navbar__mobile-profile"
                >
                  <span className="ch-navbar__avatar">{initials}</span>
                  {displayName}
                </Link>
                <button type="button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="primary"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
