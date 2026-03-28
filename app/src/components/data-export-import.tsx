"use client";

import { useState } from "react";
import { exportAllDataAsJSON, resetAllData, importDataFromJSON } from "../actions/data-export";

type BackupContentsSummary = {
  materials: number;
  inventory_logs: number;
  waste_logs: number;
  used_materials_logs: number;
  units: number;
  categories: number;
  job_types: number;
  buildings: number;
  unit_conversions: number;
  job_standards: number;
  source: "export" | "import";
};

export function DataExportImport() {
  const [isExporting, setIsExporting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backupSummary, setBackupSummary] = useState<BackupContentsSummary | null>(null);
  const JOB_STANDARDS_STORAGE_KEY = "framewatch_job_standards_v1";

  const getRecordCount = (table: unknown): number =>
    Array.isArray(table) ? table.length : 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllDataAsJSON();
      
      if (!data) {
        setMessage("Failed to export data");
        setIsExporting(false);
        return;
      }

      // Wrap raw table data with metadata so backups are traceable during migration.
      const backupEnvelope = {
        backup_version: "1",
        company: "Tuckertown Buildings",
        exported_at: new Date().toISOString(),
        source: "FrameWatch MVP",
        client_config: {
          job_standards: (() => {
            try {
              const raw = window.localStorage.getItem(JOB_STANDARDS_STORAGE_KEY);
              return raw ? JSON.parse(raw) : [];
            } catch {
              return [];
            }
          })(),
        },
        record_counts: {
          materials: getRecordCount(data.materials),
          inventory_logs: getRecordCount(data.inventory_logs),
          waste_logs: getRecordCount(data.waste_logs),
          used_materials_logs: getRecordCount(data.used_materials_logs),
          units: getRecordCount(data.units),
          categories: getRecordCount(data.categories),
          job_types: getRecordCount(data.job_types),
          buildings: getRecordCount(data.buildings),
          unit_conversions: getRecordCount(data.unit_conversions),
        },
        data,
      };

      setBackupSummary({
        ...backupEnvelope.record_counts,
        job_standards: getRecordCount(backupEnvelope.client_config.job_standards),
        source: "export",
      });

      // Create JSON file
      const jsonString = JSON.stringify(backupEnvelope, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `framewatch-tuckertown-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
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
      const parsed = JSON.parse(text);
      const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

      const parsedJobStandards = parsed?.client_config?.job_standards;
      const jobStandardsCount = Array.isArray(parsedJobStandards)
        ? parsedJobStandards.length
        : (() => {
            try {
              const local = window.localStorage.getItem(JOB_STANDARDS_STORAGE_KEY);
              const parsedLocal = local ? JSON.parse(local) : [];
              return Array.isArray(parsedLocal) ? parsedLocal.length : 0;
            } catch {
              return 0;
            }
          })();

      setBackupSummary({
        materials: getRecordCount(data.materials),
        inventory_logs: getRecordCount(data.inventory_logs),
        waste_logs: getRecordCount(data.waste_logs),
        used_materials_logs: getRecordCount(data.used_materials_logs),
        units: getRecordCount(data.units),
        categories: getRecordCount(data.categories),
        job_types: getRecordCount(data.job_types),
        buildings: getRecordCount(data.buildings),
        unit_conversions: getRecordCount(data.unit_conversions),
        job_standards: jobStandardsCount,
        source: "import",
      });

      // Restore browser-side configuration data when present.
      if (parsed?.client_config?.job_standards) {
        window.localStorage.setItem(
          JOB_STANDARDS_STORAGE_KEY,
          JSON.stringify(parsed.client_config.job_standards),
        );
      }
      
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
        window.localStorage.removeItem(JOB_STANDARDS_STORAGE_KEY);

        setMessage("✓ " + result.message);
        setBackupSummary((current) =>
          current
            ? {
                ...current,
                job_standards: 0,
              }
            : current,
        );
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
          <li>✓ Backup includes export timestamp and company metadata</li>
          <li>✓ Backup includes browser-stored job standards config</li>
          <li>✓ Import accepts both legacy raw JSON and new backup envelope format</li>
          <li>✓ JSON format is migration-ready for future multi-tenant rollout</li>
          <li>✓ Store this file off-device (Drive, OneDrive, Dropbox) for safekeeping</li>
        </ul>
      </div>

      {backupSummary ? (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-6">
          <h4 className="font-semibold text-emerald-200 mb-2">Backup Contents</h4>
          <p className="mb-3 text-xs uppercase tracking-wide text-emerald-300">
            Source: {backupSummary.source === "export" ? "Latest export" : "Latest import file"}
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-200 sm:grid-cols-2">
            <p>Materials: {backupSummary.materials}</p>
            <p>Inventory Logs: {backupSummary.inventory_logs}</p>
            <p>Waste Logs: {backupSummary.waste_logs}</p>
            <p>Used Material Logs: {backupSummary.used_materials_logs}</p>
            <p>Units: {backupSummary.units}</p>
            <p>Categories: {backupSummary.categories}</p>
            <p>Job Types: {backupSummary.job_types}</p>
            <p>Buildings: {backupSummary.buildings}</p>
            <p>Unit Conversions: {backupSummary.unit_conversions}</p>
            <p>Job Standards (Browser Config): {backupSummary.job_standards}</p>
          </div>
        </div>
      ) : null}

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
