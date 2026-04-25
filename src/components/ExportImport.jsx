import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { exportConfig, importConfig } from "../api/client";
import "./ExportImport.css";

export default function ExportImport() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);

  const exportMutation = useMutation({
    mutationFn: () => exportConfig(),
    onSuccess: (data) => {
      const filename = `chores-backup-${new Date().toISOString().split("T")[0]}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Data exported successfully!");
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to export data");
    },
  });

  const importMutation = useMutation({
    mutationFn: (data) => importConfig(data),
    onSuccess: (result) => {
      if (result.success) {
        setSuccess(`Import successful! Imported ${result.imported.people} people, ${result.imported.chores} chores, ${result.imported.settings} settings.`);
        setError(null);
        setConfirmImport(false);
        setImportFile(null);
        setImportData(null);
      } else {
        setError(result.error || "Import failed");
      }
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err) => {
      setError(err.message || "Import failed");
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(data);
        setError(null);
      } catch (err) {
        setError("Invalid JSON file");
        setImportFile(null);
        setImportData(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setImportFile(null);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (importData) {
      importMutation.mutate(importData);
    }
  };

  return (
    <div className="export-import">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="export-section">
        <h4>Export Data</h4>
        <p className="section-description">Download all chores, people, and settings as a JSON file for backup.</p>
        <button
          className="btn-primary"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? "Exporting…" : "Download Backup"}
        </button>
      </div>

      <div className="divider"></div>

      <div className="import-section">
        <h4>Import Data</h4>
        <p className="section-description">Upload a backup file to restore data. This will replace all existing chores, people, and settings.</p>

        {!confirmImport ? (
          <>
            <label htmlFor="import-file" className="file-input-label">
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
              />
              <span className="file-input-button">
                {importFile ? `Selected: ${importFile.name}` : "Choose File"}
              </span>
            </label>

            {importData && (
              <button
                className="btn-primary"
                onClick={() => setConfirmImport(true)}
                disabled={importMutation.isPending}
              >
                Proceed with Import
              </button>
            )}
          </>
        ) : (
          <div className="import-confirm">
            <div className="confirm-warning">
              <strong>⚠️ Warning</strong>
              <p>This will replace all existing data with the backup file:</p>
              <ul>
                <li>People: {importData?.people?.length || 0} entries</li>
                <li>Chores: {importData?.chores?.length || 0} entries</li>
                <li>Settings: {Object.keys(importData?.config || {}).length} entries</li>
              </ul>
              <p>This action cannot be undone.</p>
            </div>
            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setConfirmImport(false);
                  setImportFile(null);
                  setImportData(null);
                }}
                disabled={importMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleImportConfirm}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? "Importing…" : "Confirm Import"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
