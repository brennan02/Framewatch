"use client";

import { useEffect, useMemo, useState } from "react";
import QrScanner from "../scan/qr-scanner";

type MaterialOption = {
  id: string;
  name: string;
  sku: string;
};

type JobUsageFormProps = {
  materials: MaterialOption[];
  action: (formData: FormData) => void | Promise<void>;
  buildings?: Array<{
    id: string;
    name: string;
    specialId: string;
    qrValue: string;
    jobTypeName?: string;
  }>;
};

type UsageRow = {
  rowId: number;
  materialId: string;
  quantity: string;
  note: string;
};

type StandardEntry = {
  id: string;
  jobType: string;
  materialId: string;
  quantity: number;
  note?: string;
  createdAt: string;
};

const STANDARDS_STORAGE_KEY = "framewatch_job_standards_v1";

function normalizeStandardEntry(value: unknown): StandardEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  const jobType = typeof obj.jobType === "string" ? obj.jobType.trim() : "";
  const materialId = typeof obj.materialId === "string" ? obj.materialId : "";
  const quantity = Number(obj.quantity);
  const note = typeof obj.note === "string" ? obj.note.trim() : "";
  const createdAt = typeof obj.createdAt === "string" ? obj.createdAt : "";

  if (!id || !jobType || !materialId || Number.isNaN(quantity) || quantity <= 0 || !createdAt) {
    return null;
  }

  return {
    id,
    jobType,
    materialId,
    quantity,
    ...(note ? { note } : {}),
    createdAt,
  };
}

function loadStandardsFromStorage(): StandardEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STANDARDS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeStandardEntry)
      .filter((entry): entry is StandardEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function saveStandardsToStorage(entries: StandardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STANDARDS_STORAGE_KEY, JSON.stringify(entries));
}

export function JobUsageForm({ materials, action, buildings = [] }: JobUsageFormProps) {
  const [jobName, setJobName] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [rows, setRows] = useState<UsageRow[]>([
    { rowId: 1, materialId: "", quantity: "", note: "" },
  ]);
  const [nextRowId, setNextRowId] = useState(2);
  const [standards, setStandards] = useState<StandardEntry[]>([]);
  const [standardSearch, setStandardSearch] = useState("");
  const [selectedStandardType, setSelectedStandardType] = useState("");

  useEffect(() => {
    setStandards(loadStandardsFromStorage());
  }, []);

  useEffect(() => {
    const validMaterialIds = new Set(materials.map((material) => material.id));

    setStandards((current) => {
      const cleaned = current.filter((entry) => validMaterialIds.has(entry.materialId));

      if (cleaned.length !== current.length) {
        saveStandardsToStorage(cleaned);
      }

      return cleaned;
    });
  }, [materials]);

  const materialById = useMemo(
    () =>
      materials.reduce<Record<string, MaterialOption>>((acc, material) => {
        acc[material.id] = material;
        return acc;
      }, {}),
    [materials],
  );

  const standardsByType = useMemo(() => {
    const grouped = new Map<string, Map<string, number>>();

    for (const entry of standards) {
      if (!grouped.has(entry.jobType)) {
        grouped.set(entry.jobType, new Map<string, number>());
      }

      const byMaterial = grouped.get(entry.jobType) as Map<string, number>;
      byMaterial.set(entry.materialId, (byMaterial.get(entry.materialId) ?? 0) + entry.quantity);
    }

    return grouped;
  }, [standards]);

  const filteredStandardTypes = useMemo(() => {
    const query = standardSearch.trim().toLowerCase();
    const allTypes = Array.from(standardsByType.keys()).sort((a, b) => a.localeCompare(b));

    if (!query) {
      return allTypes;
    }

    return allTypes.filter((typeName) => typeName.toLowerCase().includes(query));
  }, [standardSearch, standardsByType]);

  useEffect(() => {
    if (filteredStandardTypes.length === 0) {
      setSelectedStandardType("");
      return;
    }

    if (!selectedStandardType || !filteredStandardTypes.includes(selectedStandardType)) {
      setSelectedStandardType(filteredStandardTypes[0]);
    }
  }, [filteredStandardTypes, selectedStandardType]);

  const selectedStandardRows = useMemo(() => {
    const byMaterial = standardsByType.get(selectedStandardType);
    if (!byMaterial) {
      return [];
    }

    return Array.from(byMaterial.entries())
      .map(([materialId, quantity]) => ({
        materialId,
        quantity,
        materialName: materialById[materialId]?.name ?? "Unknown Material",
      }))
      .sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [materialById, selectedStandardType, standardsByType]);

  const applySelectedStandard = () => {
    if (selectedStandardRows.length === 0) {
      return;
    }

    const nextRows: UsageRow[] = selectedStandardRows.map((row, index) => ({
      rowId: index + 1,
      materialId: row.materialId,
      quantity: String(row.quantity),
      note: `Standard: ${selectedStandardType}`,
    }));

    setRows(nextRows);
    setNextRowId(nextRows.length + 1);
  };

  const applyBuildingSelection = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    const building = buildings.find((item) => item.id === buildingId);
    if (!building) {
      return;
    }

    setJobName(building.name);
  };

  const handleBuildingQrScan = (decodedValue: string) => {
    setIsScannerOpen(false);
    const parsed = decodedValue.trim();

    // Expected payload format: FW-BLD:<specialId>:<buildingName>
    if (parsed.startsWith("FW-BLD:")) {
      const parts = parsed.split(":");
      const scannedSpecialId = parts[1]?.trim();

      if (scannedSpecialId) {
        const matchedBySpecialId = buildings.find((item) => item.specialId === scannedSpecialId);
        if (matchedBySpecialId) {
          applyBuildingSelection(matchedBySpecialId.id);
          return;
        }
      }

      const scannedName = parts.slice(2).join(":").trim();
      if (scannedName) {
        setJobName(scannedName);
      }

      return;
    }

    const matched = buildings.find(
      (item) => item.specialId === parsed || item.qrValue === parsed || item.name === parsed,
    );

    if (matched) {
      applyBuildingSelection(matched.id);
      return;
    }

    // Fallback for unknown payloads: still let user continue with scanned value.
    setJobName(parsed);
  };

  const updateRow = (rowId: number, updates: Partial<UsageRow>) => {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { rowId: nextRowId, materialId: "", quantity: "", note: "" },
    ]);
    setNextRowId((current) => current + 1);
  };

  const removeRow = (rowId: number) => {
    setRows((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((row) => row.rowId !== rowId);
    });
  };

  return (
    <form action={action} className="mt-5 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Job Name</span>
        <input
          type="text"
          name="job_name"
          value={jobName}
          onChange={(event) => setJobName(event.target.value)}
          required
          placeholder="e.g. Elm Street Duplex"
          className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        />
      </label>

      <div className="grid gap-3 rounded-xl border border-cyan-500/20 bg-[#050914] p-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Building ID (optional)</span>
          <select
            value={selectedBuildingId}
            onChange={(event) => applyBuildingSelection(event.target.value)}
            className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none"
          >
            <option value="">Select a building</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.specialId} - {building.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="rounded-xl border border-cyan-400/40 bg-[#111a2f] px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#17233d]"
          >
            Scan Building QR
          </button>
        </div>

        <p className="md:col-span-2 text-xs text-slate-400">
          Scanning or selecting a building fills the job name, but you still enter actual material
          usage below for this building.
        </p>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-[#050914] p-4">
        <p className="text-sm font-semibold text-white">Pull from standards (optional)</p>
        <p className="mt-1 text-xs text-slate-400">
          Load a standard list to see what is needed, then adjust quantities to what was actually
          used on this building.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Search Standard</span>
            <input
              type="text"
              value={standardSearch}
              onChange={(event) => setStandardSearch(event.target.value)}
              placeholder="Type job type name"
              className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Standard Job Type</span>
            <select
              value={selectedStandardType}
              onChange={(event) => setSelectedStandardType(event.target.value)}
              className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none"
            >
              {filteredStandardTypes.length === 0 ? <option value="">No standards found</option> : null}
              {filteredStandardTypes.map((typeName) => (
                <option key={typeName} value={typeName}>
                  {typeName}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={applySelectedStandard}
              disabled={selectedStandardRows.length === 0}
              className="rounded-xl border border-cyan-400/40 bg-[#111a2f] px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#17233d] disabled:opacity-50"
            >
              Load Standard
            </button>
          </div>
        </div>

        {selectedStandardRows.length > 0 ? (
          <div className="mt-3 rounded-lg border border-cyan-500/20 bg-[#0c1426]/80 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Needed by standard</p>
            <div className="mt-2 grid gap-2">
              {selectedStandardRows.map((row) => (
                <div
                  key={`needed-${row.materialId}`}
                  className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2 text-sm"
                >
                  <p className="text-white">{row.materialName}</p>
                  <p className="text-slate-300">{row.quantity} items needed</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div
            key={row.rowId}
            className="grid gap-3 rounded-xl border border-cyan-500/20 bg-[#050914] p-3 md:grid-cols-3"
          >
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Material Type #{index + 1}</span>
              <select
                name="material_id"
                value={row.materialId}
                onChange={(event) => updateRow(row.rowId, { materialId: event.target.value })}
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none"
              >
                <option value="">Select material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.sku})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">
                Quantity Used (boards, cans, pallets, etc.)
              </span>
              <input
                type="number"
                name="quantity"
                value={row.quantity}
                onChange={(event) => updateRow(row.rowId, { quantity: event.target.value })}
                min={1}
                step={1}
                placeholder="0"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <div className="grid gap-2 text-sm">
              <label className="grid gap-2">
                <span className="text-slate-300">Note (optional)</span>
                <input
                  type="text"
                  name="note"
                  value={row.note}
                  onChange={(event) => updateRow(row.rowId, { note: event.target.value })}
                  placeholder="Optional"
                  className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => removeRow(row.rowId)}
                className="justify-self-start rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
              >
                Remove Row
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-xl border border-cyan-400/40 bg-[#111a2f] px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#17233d]"
        >
          Add Item Type
        </button>

        <button
          type="submit"
          className="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
        >
          Save Job Usage Entries
        </button>
      </div>

      {isScannerOpen ? (
        <QrScanner
          onScan={handleBuildingQrScan}
          onClose={() => setIsScannerOpen(false)}
        />
      ) : null}
    </form>
  );
}
