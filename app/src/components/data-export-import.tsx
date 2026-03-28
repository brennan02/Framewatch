"use client";

import { useState } from "react";
import { exportAllDataAsJSON, resetAllData, importDataFromJSON } from "../../src/actions/data-export";

export function DataExportImport() {
  const [isExporting, setIsExporting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

      // Import the data
      const result = await importDataFromJSON(data);
      
      if (result.success) {
        setMessage(result.message);
        setUploadStatus("success");
      } else {
        setMessage(result.message);
        setUploadStatus("error");
      }
      
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

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetAllData();
      if (result.success) {
        setMessage("✓ " + result.message);
        setShowResetConfirm(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("✗ " + result.message);
      }
    } catch (error) {
      setMessage("✗ Reset failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsResetting(false);
    }
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

      {/* Reset Section */}
      {!showResetConfirm ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-400 mb-4">
            Permanently delete all data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="rounded-lg border border-red-400/60 bg-red-500/10 px-6 py-2 font-semibold text-red-200 hover:bg-red-500/20 text-sm"
          >
            Reset All Data
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-red-400/60 bg-red-500/20 p-6">
          <h3 className="text-lg font-semibold text-red-200 mb-2">Confirm Data Reset</h3>
          <p className="text-sm text-slate-300 mb-4">
            This will permanently delete all data from materials, inventory logs, waste logs, used materials, units, categories, job types, buildings, and conversions.
          </p>
          <p className="text-sm text-red-300 font-semibold mb-4">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="rounded-lg border border-red-400/60 bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {isResetting ? "Resetting..." : "Yes, Delete Everything"}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
              className="rounded-lg border border-slate-400/60 bg-slate-600 px-6 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
          </div>
          {message && (
            <div className={`mt-3 text-sm ${message.includes("✓") ? "text-green-300" : "text-red-300"}`}>
              {message}
              {message.includes("RLS policies") && (
                <div className="mt-2 text-xs text-slate-300 border-t border-slate-600 pt-2">
                  <p>If RLS is blocking deletion, you can disable it in Supabase:</p>
                  <p className="mt-1 font-mono text-slate-400">1. Go to your table in Supabase</p>
                  <p className="font-mono text-slate-400">2. Click "Authentication" tab</p>
                  <p className="font-mono text-slate-400">3. Toggle "Enable RLS" off</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
