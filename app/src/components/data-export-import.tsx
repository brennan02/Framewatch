"use client";

import { useState } from "react";
import { exportAllDataAsJSON } from "../../src/actions/data-export";

export function DataExportImport() {
  const [isExporting, setIsExporting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllDataAsJSON();
      
      if (!data) {
        setMessage("Failed to export data");
        setIsExporting(false);
        return;
      }

      // Create JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `framewatch-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage("Data exported successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Export failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("loading");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate structure
      const requiredTables = [
        "materials",
        "inventory_logs",
        "waste_logs",
        "used_materials_logs",
      ];
      
      for (const table of requiredTables) {
        if (!Array.isArray(data[table])) {
          throw new Error(`Invalid format: missing or invalid ${table}`);
        }
      }

      // Show preview
      setMessage(
        `Preview: ${Object.entries(data)
          .map(([key, value]: [string, any]) => `${key}: ${value.length} records`)
          .join(", ")}`
      );
      setUploadStatus("success");
      setTimeout(() => {
        setUploadStatus("idle");
        setMessage("");
      }, 5000);
    } catch (error) {
      setMessage(`Import failed: ${error instanceof Error ? error.message : "Invalid file"}`);
      setUploadStatus("error");
      setTimeout(() => {
        setUploadStatus("idle");
        setMessage("");
      }, 5000);
    }

    // Reset file input
    if (e.target) e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="rounded-lg border border-cyan-400/20 bg-[#0c1426]/80 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Export Data</h3>
        <p className="text-sm text-slate-400 mb-4">
          Download all current data as a JSON file. Useful for backups and migration to multi-tenant system.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-lg border border-blue-400/60 bg-blue-500/10 px-6 py-2 font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50 text-sm"
        >
          {isExporting ? "Exporting..." : "Download JSON Export"}
        </button>
        {message && (
          <p className="mt-3 text-sm text-slate-300">{message}</p>
        )}
      </div>

      {/* Import Section */}
      <div className="rounded-lg border border-cyan-400/20 bg-[#0c1426]/80 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Import Data</h3>
        <p className="text-sm text-slate-400 mb-4">
          Upload a previously exported JSON file. This is useful for testing or migrating to a new system.
        </p>
        <label className="block">
          <span className="sr-only">Choose file to import</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            disabled={uploadStatus === "loading"}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border file:border-cyan-400/30
              file:text-sm file:font-semibold
              file:bg-cyan-500/10 file:text-cyan-200
              hover:file:bg-cyan-500/20
              disabled:opacity-50"
          />
        </label>
        {uploadStatus === "success" && (
          <div className="mt-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3 text-sm text-green-200">
            ✓ {message}
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            ✗ {message}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-6">
        <h4 className="font-semibold text-blue-200 mb-2">Migration Ready</h4>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>✓ Export captures all current data</li>
          <li>✓ JSON format is migration-ready for multi-tenant</li>
          <li>✓ Each table includes all records with original IDs</li>
          <li>✓ When migrating, company_id will be added automatically</li>
        </ul>
      </div>
    </div>
  );
}
