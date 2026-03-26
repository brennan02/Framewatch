"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { fetchMaterialsFromSupabase } from "../lib/supabase";
import { updateInventoryAction } from "../actions/inventory";
import QrScanner from "./scan/qr-scanner";

type Material = {
  id: string;
  name: string;
  sku: string;
  scanCode: string;
  category: string;
  unit: string;
};

type InventoryFormProps = {
  status?: string;
  message?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {pending ? "Updating..." : "Update Inventory"}
    </button>
  );
}

export function InventoryForm({ status, message }: InventoryFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [scanCode, setScanCode] = useState("");
  const [pieces, setPieces] = useState("");
  const [selectedAction, setSelectedAction] = useState("Use");
  const [jobName, setJobName] = useState("");
  const [note, setNote] = useState("");
  const [defectReason, setDefectReason] = useState("broken");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const actions = ["Use", "Waste", "Salvage", "Received"];
  const defectReasons = ["broken", "warped", "defective", "damaged", "mismeasured", "other"];

  useEffect(() => {
    const loadMaterials = async () => {
      setMaterialsLoading(true);
      const { data, error } = await fetchMaterialsFromSupabase();
      if (!error) {
        setMaterials(data ?? []);
      }
      setMaterialsLoading(false);
    };

    void loadMaterials();
  }, []);

  const handleScanCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.trim();
    setScanCode(code);

    if (code) {
      const upper = code.toUpperCase();
      const found = materials.find(
        (m) => m.sku.toUpperCase() === upper || m.scanCode.toUpperCase() === upper || m.id === code
      );
      if (found) {
        setSelectedMaterial(found);
      }
    }
  };

  const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    const found = materials.find((m) => m.id === materialId);
    setSelectedMaterial(found || null);
    setScanCode("");
  };

  const handleQRScan = (scannedValue: string) => {
    setIsScannerOpen(false);
    const code = scannedValue.trim().toUpperCase();
    setScanCode(scannedValue.trim());

    const found = materials.find(
      (m) =>
        m.scanCode.toUpperCase() === code ||
        m.sku.toUpperCase() === code ||
        m.id === scannedValue.trim()
    );
    if (found) {
      setSelectedMaterial(found);
    }
  };

  return (
    <>
      {status === "success" ? (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Inventory updated successfully.
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {message || "Unable to update inventory. Please try again."}
        </div>
      ) : null}

      {isScannerOpen && (
        <QrScanner
          onScan={handleQRScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <form action={updateInventoryAction} className="mt-6 space-y-5">
        {/* Hidden field for material_id */}
        <input
          type="hidden"
          name="material_id"
          value={selectedMaterial?.id || ""}
        />

        {/* Hidden field for defect_reason (used when action is Waste) */}
        <input
          type="hidden"
          name="defect_reason"
          value={defectReason}
        />

        {/* Selection */}
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Scan SKU</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanCode}
                onChange={handleScanCodeChange}
                placeholder="Scan or enter SKU..."
                className="flex-1 rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
                autoComplete="off"
                autoFocus
                readOnly={materialsLoading}
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                title="Open camera to scan QR code"
              >
                📷
              </button>
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Or Select Material</span>
            <select
              value={selectedMaterial?.id || ""}
              onChange={handleMaterialSelect}
              disabled={materialsLoading}
              className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none disabled:opacity-50 text-sm"
            >
              <option value="">
                {materialsLoading ? "Loading materials..." : "Select a material"}
              </option>
              {materials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.sku})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Material Info */}
        {selectedMaterial && (
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm">
            <p className="font-semibold text-cyan-200">{selectedMaterial.name}</p>
            <p className="text-xs text-slate-400 mt-2">
              Category: <span className="text-slate-300">{selectedMaterial.category}</span> • Unit: <span className="text-slate-300">{selectedMaterial.unit}</span>
            </p>
          </div>
        )}

        {/* Action & Quantity */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Action *</span>
            <select
              name="action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none text-sm"
            >
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Pieces *</span>
            <input
              type="number"
              name="quantity"
              value={pieces}
              onChange={(e) => setPieces(e.target.value)}
              required
              min="1"
              step="1"
              placeholder="0"
              className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
            />
          </label>
        </div>

        {/* Defect Reason (only for Waste action) */}
        {selectedAction === "Waste" && (
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Type of Waste *</span>
            <select
              value={defectReason}
              onChange={(e) => setDefectReason(e.target.value)}
              className="rounded-lg border border-red-600/60 bg-red-950/50 px-3 py-2 text-white focus:border-red-400 focus:outline-none text-sm"
            >
              {defectReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Optional Fields */}
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Job Name (optional)</span>
          <input
            type="text"
            name="job_name"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g., Foundation"
            className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Note (optional)</span>
          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional details..."
            className="min-h-14 rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
          />
        </label>

        <SubmitButton />
      </form>
    </>
  );
}