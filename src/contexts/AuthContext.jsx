import React, { createContext, useContext, useState, useEffect } from "react";
import { setToken, clearToken, getToken } from "../utils/auth";
import { login as apiLogin, logout as apiLogout, getSetupStatus, getCurrentUser } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const userInfo = await getCurrentUser();
          setUser(userInfo);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to get current user:", err);
          clearToken();
          setIsAuthenticated(false);
        }
      } else {
        // Check if setup is needed when no token exists
        try {
          const status = await getSetupStatus();
          setSetupNeeded(status.setup_needed);
        } catch (err) {
          console.error("Failed to check setup status:", err);
          // Default to login if status check fails
          setSetupNeeded(false);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await apiLogin(username, password);
      setToken(response.access_token);
      setUser(response.user);
      setIsAuthenticated(true);
      return response.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearToken();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const { changePassword: apiChangePassword } = await import("../api/client");
      await apiChangePassword(oldPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    isAuthenticated,
    setupNeeded,
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
