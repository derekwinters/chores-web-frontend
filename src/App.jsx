import React, { useState, useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import Setup from "./pages/Setup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chores from "./pages/Chores";
import UserManagement from "./components/UserManagement";
import Log from "./components/Log";
import Preferences from "./pages/Preferences";
import SettingsLayout from "./pages/SettingsLayout";
import SettingsGeneral from "./pages/SettingsGeneral";
import SettingsAuth from "./pages/SettingsAuth";
import SettingsChores from "./pages/SettingsChores";
import SettingsTheme from "./pages/SettingsTheme";
import SettingsData from "./pages/SettingsData";
import SettingsDataPointsLog from "./pages/SettingsDataPointsLog";
import SettingsAbout from "./pages/SettingsAbout";
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
            onPreferences={() => navigate("/preferences")}
            onSettings={() => navigate("/settings")}
            isAdmin={loggedInUser?.is_admin}
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
          onPreferences={() => navigate("/preferences")}
          onSettings={() => navigate("/settings")}
          isAdmin={loggedInUser?.is_admin}
        />
      </aside>
      <div className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}></div>
      <div className="app-content">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chores" element={<Chores />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/:userName" element={<UserDetail />} />
            <Route path="/log" element={<Log />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route
              path="/settings"
              element={<SettingsLayout onTitleUpdate={(newTitle) => setAppTitle(newTitle)} />}
            >
              <Route index element={<Navigate to="/settings/general" replace />} />
              <Route path="general" element={<SettingsGeneral />} />
              <Route path="auth" element={<SettingsAuth />} />
              <Route path="chores" element={<SettingsChores />} />
              <Route path="theme" element={<SettingsTheme />} />
              <Route path="data" element={<SettingsData />} />
              <Route path="data/pointslog" element={<SettingsDataPointsLog />} />
              <Route path="about" element={<SettingsAbout />} />
            </Route>
            <Route path="/admin" element={<Navigate to="/settings/general" replace />} />
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
  const [dbReady, setDbReady] = useState(false);
  const [checkingDb, setCheckingDb] = useState(true);

  useEffect(() => {
    const checkDbStatus = async () => {
      let attempts = 0;
      // In test environment, use much shorter interval and max attempts
      const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
      const pollInterval = isTest ? 10 : 500;
      const maxAttempts = isTest ? 10 : 60;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch("/status/db-status");
          const data = await response.json();

          if (data.status === "ready") {
            setDbReady(true);
            setCheckingDb(false);
            return;
          }
        } catch (e) {
          // DB not responding yet
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // After max attempts, proceed anyway
      setDbReady(true);
      setCheckingDb(false);
    };

    checkDbStatus();
  }, []);

  if (checkingDb) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Database initializing...</p>
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <p>Database startup timeout. Retrying...</p>
        </div>
      </div>
    );
  }

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
