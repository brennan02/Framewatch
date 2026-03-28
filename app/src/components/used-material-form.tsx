"use client";

import { useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import { logUsedMaterialAction } from "../actions/used-material";
import { fetchMaterialsFromSupabase, fetchUnitsFromSupabase } from "../lib/supabase";

type Material = {
  id: string;
  name: string;
  sku: string;
};

export function UsedMaterialForm({
  status,
  message,
}: {
  status?: string;
  message?: string;
}) {
  const { pending } = useFormStatus();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [materialsRes, unitsRes] = await Promise.all([
        fetchMaterialsFromSupabase(),
        fetchUnitsFromSupabase(),
      ]);

      if (materialsRes.data) {
        setMaterials(materialsRes.data);
      }
      if (unitsRes.data) {
        setUnits(unitsRes.data);
      }
      setLoadingMaterials(false);
    };

    fetchData();
  }, []);

  return (
    <form action={logUsedMaterialAction} className="space-y-4">
      {status === "success" && (
        <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3 text-sm text-green-200">
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Material *
        </label>
        <select
          name="materialId"
          required
          disabled={loadingMaterials}
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50"
        >
          <option value="">
            {loadingMaterials ? "Loading materials..." : "Select a material..."}
          </option>
          {materials.map((mat) => (
            <option key={mat.id} value={mat.id}>
              {mat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Size *
          </label>
          <input
            type="text"
            name="size"
            required
            placeholder="e.g., 4, 6, 8"
            className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Unit *
          </label>
          <select
            name="unit"
            required
            disabled={loadingMaterials}
            className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select unit...</option>
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Quantity (number of pieces) *
        </label>
        <input
          type="number"
          name="quantity"
          required
          min="1"
          placeholder="How many pieces of this size"
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Job or Project Name
        </label>
        <input
          type="text"
          name="jobName"
          placeholder="e.g., Cabin A12, Storage B5"
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          placeholder="e.g., Good condition scrap from job, suitable for framing"
          rows={3}
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending || loadingMaterials}
        className="w-full rounded-lg border border-green-400/60 bg-green-500/10 px-4 py-2 font-semibold text-green-200 hover:bg-green-500/20 disabled:opacity-50 text-sm"
      >
        {pending ? "Logging..." : "Log Used Material"}
      </button>
    </form>
  );
}
