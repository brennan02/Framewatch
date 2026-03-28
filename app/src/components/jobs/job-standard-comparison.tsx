"use client";

import { useEffect, useMemo, useState } from "react";

type MaterialOption = {
  id: string;
  name: string;
  sku: string;
};

type JobSupply = {
  materialId: string;
  materialName: string;
  quantityUsed: number;
};

type CompletedJob = {
  jobName: string;
  totalSuppliesUsed: number;
  totalUsageEntries: number;
  supplies: JobSupply[];
};

type StandardEntry = {
  id: string;
  jobType: string;
  materialId: string;
  quantity: number;
  note?: string;
  createdAt: string;
};

type JobStandardComparisonProps = {
  materials: MaterialOption[];
  completedJobs: CompletedJob[];
};

const STORAGE_KEY = "framewatch_job_standards_v1";

function normalizeStandard(value: unknown): StandardEntry | null {
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeStandard)
      .filter((entry): entry is StandardEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function saveStandardsToStorage(entries: StandardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function JobStandardComparison({ materials, completedJobs }: JobStandardComparisonProps) {
  const [standards, setStandards] = useState<StandardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStandardJobType, setSelectedStandardJobType] = useState("");
  const [selectedProjectJobName, setSelectedProjectJobName] = useState("");

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
      const jobType = entry.jobType;
      if (!grouped.has(jobType)) {
        grouped.set(jobType, new Map<string, number>());
      }

      const current = grouped.get(jobType) as Map<string, number>;
      current.set(entry.materialId, (current.get(entry.materialId) ?? 0) + entry.quantity);
    }

    return grouped;
  }, [standards]);

  const filteredStandardTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = Array.from(standardsByType.keys()).sort((a, b) => a.localeCompare(b));

    if (!query) {
      return all;
    }

    return all.filter((jobType) => jobType.toLowerCase().includes(query));
  }, [search, standardsByType]);

  useEffect(() => {
    if (filteredStandardTypes.length === 0) {
      setSelectedStandardJobType("");
      return;
    }

    if (!selectedStandardJobType || !filteredStandardTypes.includes(selectedStandardJobType)) {
      setSelectedStandardJobType(filteredStandardTypes[0]);
    }
  }, [filteredStandardTypes, selectedStandardJobType]);

  useEffect(() => {
    if (completedJobs.length === 0) {
      setSelectedProjectJobName("");
      return;
    }

    if (!selectedProjectJobName || !completedJobs.some((job) => job.jobName === selectedProjectJobName)) {
      setSelectedProjectJobName(completedJobs[0].jobName);
    }
  }, [completedJobs, selectedProjectJobName]);

  const selectedStandardMap = useMemo(() => {
    if (!selectedStandardJobType) {
      return new Map<string, number>();
    }

    return standardsByType.get(selectedStandardJobType) ?? new Map<string, number>();
  }, [selectedStandardJobType, standardsByType]);

  const selectedProject = useMemo(
    () => completedJobs.find((job) => job.jobName === selectedProjectJobName),
    [completedJobs, selectedProjectJobName],
  );

  const actualMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const supply of selectedProject?.supplies ?? []) {
      map.set(supply.materialId, supply.quantityUsed);
    }

    return map;
  }, [selectedProject]);

  const comparisonRows = useMemo(() => {
    const materialIds = new Set<string>([
      ...Array.from(selectedStandardMap.keys()),
      ...Array.from(actualMap.keys()),
    ]);

    return Array.from(materialIds)
      .map((materialId) => {
        const standard = selectedStandardMap.get(materialId) ?? 0;
        const actual = actualMap.get(materialId) ?? 0;
        const variance = actual - standard;

        return {
          materialId,
          materialName: materialById[materialId]?.name ?? "Unknown Material",
          materialSku: materialById[materialId]?.sku ?? "Unknown SKU",
          standard,
          actual,
          variance,
        };
      })
      .sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [actualMap, materialById, selectedStandardMap]);

  return (
    <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
      <h2 className="text-xl font-semibold">Compare finished job to standard</h2>
      <p className="mt-2 text-sm text-slate-300">
        Search standards, select one, and compare expected counts to actual project usage.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-cyan-200" htmlFor="standardSearch">
            Search Standard
          </label>
          <input
            id="standardSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type job type name"
            className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-cyan-200" htmlFor="standardTypeSelect">
            Standard Job Type
          </label>
          <select
            id="standardTypeSelect"
            value={selectedStandardJobType}
            onChange={(event) => setSelectedStandardJobType(event.target.value)}
            className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            {filteredStandardTypes.length === 0 ? <option value="">No standards found</option> : null}
            {filteredStandardTypes.map((jobType) => (
              <option key={jobType} value={jobType}>
                {jobType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-cyan-200" htmlFor="projectSelect">
            Finished Project
          </label>
          <select
            id="projectSelect"
            value={selectedProjectJobName}
            onChange={(event) => setSelectedProjectJobName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          >
            {completedJobs.length === 0 ? <option value="">No completed jobs found</option> : null}
            {completedJobs.map((job) => (
              <option key={job.jobName} value={job.jobName}>
                {job.jobName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredStandardTypes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          No standards match your search. Add standards on the Job Standards page.
        </p>
      ) : null}

      {completedJobs.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          No finished jobs with usage data found yet.
        </p>
      ) : null}

      {comparisonRows.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-cyan-500/20">
          <table className="min-w-full divide-y divide-cyan-500/20 text-sm">
            <thead className="bg-[#111a2f]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-200">Material</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-200">Standard</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-200">Actual</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-200">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/20 bg-[#050914]">
              {comparisonRows.map((row) => (
                <tr key={row.materialId}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-white">{row.materialName}</p>
                    <p className="text-xs text-slate-400">{row.materialSku}</p>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-200">{row.standard}</td>
                  <td className="px-3 py-2 text-right text-slate-200">{row.actual}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      row.variance > 0
                        ? "text-amber-300"
                        : row.variance < 0
                          ? "text-cyan-300"
                          : "text-emerald-300"
                    }`}
                  >
                    {row.variance > 0 ? `+${row.variance}` : row.variance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-cyan-500/20 bg-[#050914] px-3 py-3 text-sm text-slate-300">
          Select both a standard and a finished project to view comparison results.
        </p>
      )}
    </div>
  );
}
