import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExportImport from "../components/ExportImport";
import * as client from "../api/client";

vi.mock("../api/client");

beforeEach(() => {
  // Mock URL.createObjectURL and URL.revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();
});

describe("ExportImport", () => {
  const mockExportData = {
    schemaVersion: "abc123",
    exportDate: "2026-04-25T00:00:00",
    config: { title: "Test" },
    people: [{ id: 1, name: "Test User" }],
    chores: [{ id: 1, name: "Test Chore" }],
  };

  function wrap(ui) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders export and import sections", () => {
    wrap(<ExportImport />);
    expect(screen.getByText("Export Data")).toBeInTheDocument();
    expect(screen.getByText("Import Data")).toBeInTheDocument();
  });

  it("renders export button", () => {
    wrap(<ExportImport />);
    const exportBtn = screen.getByText("Download Backup");
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).not.toBeDisabled();
  });

  it("calls exportConfig on export button click", async () => {
    client.exportConfig.mockResolvedValue(mockExportData);
    wrap(<ExportImport />);

    const exportBtn = screen.getByText("Download Backup");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(client.exportConfig).toHaveBeenCalled();
    });
  });

  it("shows success message after export", async () => {
    client.exportConfig.mockResolvedValue(mockExportData);
    wrap(<ExportImport />);

    fireEvent.click(screen.getByText("Download Backup"));

    await waitFor(() => {
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });
  });

  it("renders file input for import", () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("shows error on invalid JSON file", async () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File(["invalid json"], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Invalid JSON file")).toBeInTheDocument();
    });
  });

  it("shows file selected after choosing file", async () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Selected: backup.json/)).toBeInTheDocument();
    });
  });

  it("shows confirmation dialog after file selection", async () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      expect(screen.getByText("⚠️ Warning")).toBeInTheDocument();
      expect(screen.getByText(/confirm import/i)).toBeInTheDocument();
    });
  });

  it("shows data summary in confirmation", async () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      expect(screen.getByText(/People: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Chores: 1/)).toBeInTheDocument();
    });
  });

  it("calls importConfig on confirm import", async () => {
    client.importConfig.mockResolvedValue({ success: true, imported: { people: 1, chores: 1, settings: 1 } });
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Confirm Import"));
    });

    await waitFor(() => {
      expect(client.importConfig).toHaveBeenCalledWith(mockExportData);
    });
  });

  it("shows success message after import", async () => {
    client.importConfig.mockResolvedValue({ success: true, imported: { people: 1, chores: 1, settings: 1 } });
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Confirm Import"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Import successful/i)).toBeInTheDocument();
    });
  });

  it("shows error message on import failure", async () => {
    client.importConfig.mockResolvedValue({ success: false, error: "Import failed: validation error" });
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Confirm Import"));
    });

    await waitFor(() => {
      expect(screen.getByText("Import failed: validation error")).toBeInTheDocument();
    });
  });

  it("can cancel import confirmation", async () => {
    wrap(<ExportImport />);
    const fileInput = document.querySelector('input[type="file"]');

    const file = new File([JSON.stringify(mockExportData)], "backup.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Proceed with Import"));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Cancel"));
    });

    await waitFor(() => {
      expect(screen.queryByText("⚠️ Warning")).not.toBeInTheDocument();
    });
  });
});
