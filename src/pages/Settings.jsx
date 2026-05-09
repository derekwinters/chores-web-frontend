import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Settings page has been migrated to /settings/* sub-pages.
 * This component redirects to /settings/general.
 */
export default function Settings() {
  return <Navigate to="/settings/general" replace />;
}
