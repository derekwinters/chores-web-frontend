import React, { useState, useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./contexts/AuthContext";
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Setup from "./pages/Setup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Manage from "./pages/Manage";
import UserManagement from "./components/UserManagement";
import Log from "./components/Log";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import UserDetail from "./pages/UserDetail";
import UserAvatarMenu from "./components/UserAvatarMenu";
import { getConfig, getCurrentTheme, getPeople } from "./api/client";
import { MdDashboard, MdCheckCircle, MdPeople, MdHistory, MdSettings, MdMenu } from "react-icons/md";
import { applyTheme, DEFAULT_THEME_COLORS } from "./utils/theme";
import "./App.css";

const PAGES = [
  { key: "dashboard", path: "/", label: "Board", Icon: MdDashboard },
  { key: "chores", path: "/chores", label: "Chores", Icon: MdCheckCircle },
  { key: "users", path: "/users", label: "Users", Icon: MdPeople, adminOnly: true },
  { key: "log", path: "/log", label: "Log", Icon: MdHistory },
];

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved === null ? true : saved === "true";
  });
  const [appTitle, setAppTitle] = useState("Family Chores");
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const { logout, user: authUser } = useAuth();

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    if (config?.title) {
      setAppTitle(config.title);
    }
  }, [config]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const mainElement = document.querySelector(".app-main");
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      setNavVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;
    setSidebarOpen(false);
  }, [location.pathname]);

  const loggedInUser = authUser && people.length > 0 ? people.find((p) => p.username === authUser.username) || people[0] : null;
  const displayUser = loggedInUser || { name: "Anonymous", color: "#666" };

  return (
    <div className="app">
      <nav className={`app-topnav ${navVisible ? "visible" : "hidden"}`}>
        <button
          className="topnav-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <MdMenu />
        </button>
        <span className="topnav-title">{appTitle}</span>
        <div className="topnav-user">
          <UserAvatarMenu
            user={displayUser}
            onLogout={logout}
            onSettings={() => navigate("/settings")}
            directSettings={true}
          />
        </div>
      </nav>
      <aside className={`app-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <MdMenu />
          </button>
          <span className="app-title">{appTitle}</span>
        </div>
        <nav className="sidebar-nav">
          {PAGES.filter(page => !page.adminOnly || loggedInUser?.is_admin).map(({ key, path, label, Icon }) => (
            <Link
              key={key}
              to={path}
              className={location.pathname === path ? "nav-active" : "nav-btn"}
              title={label}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <UserAvatarMenu
          user={displayUser}
          onLogout={logout}
          onSettings={() => navigate("/settings")}
        />
      </aside>
      <div className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}></div>
      <div className="app-content">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chores" element={<Manage />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/:userName" element={<UserDetail />} />
            <Route path="/log" element={<Log />} />
            <Route path="/settings" element={<Settings onTitleUpdate={(newTitle) => setAppTitle(newTitle)} />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const [themeApplied, setThemeApplied] = useState(false);
  const { data: currentTheme, isLoading, isError } = useQuery({
    queryKey: ["current-theme"],
    queryFn: getCurrentTheme,
    staleTime: 60_000,
  });

  useLayoutEffect(() => {
    if (currentTheme?.colors) {
      applyTheme(currentTheme.colors);
      setThemeApplied(true);
      return;
    }

    if (isError) {
      applyTheme(DEFAULT_THEME_COLORS);
      setThemeApplied(true);
    }
  }, [currentTheme, isError]);

  if (isLoading || !themeApplied) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default function App() {
  const { isAuthenticated, setupNeeded, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    if (setupNeeded) {
      return <Setup onSetupSuccess={() => window.location.reload()} />;
    }
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  return <AuthenticatedApp />;
}
