"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { fetchMaterialsFromSupabase, fetchInventoryLogsFromSupabase } from "../lib/supabase";
import { logWasteAction } from "../actions/waste";
import type { WasteDefectReason } from "../types/waste";

type Material = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

type WasteFormProps = {
  status?: string;
  message?: string;
};

const defectReasons: WasteDefectReason[] = [
  "warped",
  "broken",
  "defective",
  "damaged",
  "mismeasured",
  "other",
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-2 font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {pending ? "Logging waste..." : "Log Waste"}
    </button>
  );
}

export function WasteForm({ status, message }: WasteFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState("");
  const [defectReason, setDefectReason] = useState<WasteDefectReason>("broken");
  const [jobName, setJobName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadMaterials = async () => {
      setMaterialsLoading(true);
      const { data: allMaterials, error: materialsError } = await fetchMaterialsFromSupabase();
      const { data: logs, error: logsError } = await fetchInventoryLogsFromSupabase();

      if (!materialsError && allMaterials) {
        // Find materials that have been inventoried (have at least one log entry)
        const inventoriedMaterialIds = new Set<string>();
        if (logs) {
          logs.forEach((log: any) => {
            inventoriedMaterialIds.add(log.materialId);
          });
        }

        // Filter to show only inventoried materials
        const filteredMaterials = allMaterials.filter(
          (mat: Material) => inventoriedMaterialIds.has(mat.id)
        );
        setMaterials(filteredMaterials);
      }
      setMaterialsLoading(false);
    };

    void loadMaterials();
  }, []);

  const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialId = e.target.value;
    const found = materials.find((m) => m.id === materialId);
    setSelectedMaterial(found || null);
  };

  return (
    <>
      {status === "success" ? (
        <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Waste logged successfully.
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {message || "Unable to log waste. Please try again."}
        </div>
      ) : null}

      <form action={logWasteAction} className="mt-6 space-y-5">
        <input
          type="hidden"
          name="material_id"
          value={selectedMaterial?.id || ""}
        />

        {/* Material Selection */}
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Material *</span>
          <select
            value={selectedMaterial?.id || ""}
            onChange={handleMaterialSelect}
            disabled={materialsLoading}
            className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none disabled:opacity-50 text-sm"
          >
            <option value="">
              {materialsLoading ? "Loading materials..." : materials.length === 0 ? "No inventoried materials yet" : "Select a material"}
            </option>
            {materials.map((mat) => (
              <option key={mat.id} value={mat.id}>
                {mat.name} ({mat.sku})
              </option>
            ))}
          </select>
        </label>

        {/* Material Info */}
        {selectedMaterial && (
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm">
            <p className="font-semibold text-cyan-200">{selectedMaterial.name}</p>
            <p className="text-xs text-slate-400 mt-2">
              Category: <span className="text-slate-300">{selectedMaterial.category}</span> • Unit: <span className="text-slate-300">{selectedMaterial.unit}</span>
            </p>
          </div>
        )}

        {/* Quantity and Reason */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Quantity (Boards) *</span>
            <input
              type="number"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              step="1"
              placeholder="0"
              className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Defect Reason *</span>
            <select
              name="defect_reason"
              value={defectReason}
              onChange={(e) => setDefectReason(e.target.value as WasteDefectReason)}
              className="rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none text-sm"
            >
              {defectReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

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
          <span className="text-slate-300">Notes (optional)</span>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details about the waste..."
            className="min-h-14 rounded-lg border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none text-sm"
          />
        </label>

        <SubmitButton />
      </form>
    </>
  );
}