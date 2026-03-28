"use client";

import { useState } from "react";

type Material = {
  id: string;
  name: string;
  sku: string;
};

type GroupedLog = {
  id: string;
  materialId: string;
  quantity: number;
  size: string;
  unit: string;
  jobName?: string;
  notes?: string;
  createdAt: string;
  totalQuantity: number;
  jobNames: string[];
};

export function AllocateForm({
  filteredLogs,
  materialMap,
  searchSize,
  searchUnit,
}: {
  filteredLogs: GroupedLog[];
  materialMap: Map<string, Material>;
  searchSize: number;
  searchUnit: string;
}) {
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState(filteredLogs[0]?.materialId || "");

  // Filter logs for selected material
  const materialLogs = filteredLogs.filter((log) => log.materialId === selectedMaterialId);

  // Calculate allocation
  const allocation: Array<{ log: GroupedLog; allocated: number }> = [];
  let remainingNeeded = quantityNeeded ? parseInt(quantityNeeded, 10) : 0;

  for (const log of materialLogs) {
    if (remainingNeeded <= 0) break;
    const allocated = Math.min(remainingNeeded, log.totalQuantity);
    allocation.push({ log, allocated });
    remainingNeeded -= allocated;
  }

  const canFulfill = remainingNeeded === 0 && quantityNeeded;
  const material = materialMap.get(selectedMaterialId);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Material
        </label>
        <select
          value={selectedMaterialId}
          onChange={(e) => setSelectedMaterialId(e.target.value)}
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        >
          {[...new Set(filteredLogs.map((log) => log.materialId))].map((matId) => {
            const mat = materialMap.get(matId);
            return (
              <option key={matId} value={matId}>
                {mat?.name || "Unknown"}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Quantity Needed
        </label>
        <input
          type="number"
          value={quantityNeeded}
          onChange={(e) => setQuantityNeeded(e.target.value)}
          min="1"
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
          placeholder="Enter quantity needed"
        />
      </div>

      {quantityNeeded && (
        <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
          <p className="text-sm font-semibold text-blue-200 mb-3">Allocation Plan (smallest to largest):</p>
          {allocation.length > 0 ? (
            <div className="space-y-2">
              {allocation.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-300">
                  <span>
                    {item.allocated} board(s) of {item.log.size} {item.log.unit}
                  </span>
                  <span className="text-blue-300 font-semibold">({item.allocated} units)</span>
                </div>
              ))}
              <div className="border-t border-blue-400/20 pt-2 mt-2 flex justify-between text-sm font-semibold text-blue-200">
                <span>Total</span>
                <span>
                  {allocation.reduce((sum, a) => sum + a.allocated, 0)} /{" "}
                  {quantityNeeded} units
                </span>
              </div>
              {!canFulfill && (
                <p className="text-xs text-red-300 mt-2">
                  ⚠️ Not enough materials. Short by{" "}
                  {remainingNeeded} units.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No available materials for this selection.</p>
          )}
        </div>
      )}

      {canFulfill && (
        <button
          className="w-full rounded-lg border border-green-400/60 bg-green-500/10 px-4 py-2 font-semibold text-green-200 hover:bg-green-500/20 text-sm"
        >
          Allocate Materials
        </button>
      )}
    </div>
  );
}
