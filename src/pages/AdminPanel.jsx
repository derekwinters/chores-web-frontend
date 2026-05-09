import React from "react";
import { Navigate } from "react-router-dom";

/**
 * AdminPanel is kept for backward compatibility.
 * The admin panel has been migrated to /settings/* routes.
 * This component redirects to /settings/general.
 */
export default function AdminPanel() {
  return <Navigate to="/settings/general" replace />;
}
