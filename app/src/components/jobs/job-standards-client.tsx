"use client";

import { useEffect, useMemo, useState } from "react";

type MaterialOption = {
  id: string;
  name: string;
  sku: string;
};

type StandardEntry = {
  id: string;
  jobType: string;
  materialId: string;
  quantity: number;
  note?: string;
  createdAt: string;
};

type JobStandardsClientProps = {
  materials: MaterialOption[];
  jobTypes: string[];
};

type StandardRow = {
  materialId: string;
  quantity: string;
  note: string;
};

const STORAGE_KEY = "framewatch_job_standards_v1";

function normalizeEntry(value: unknown): StandardEntry | null {
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

function loadStandards(): StandardEntry[] {
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

    return parsed.map(normalizeEntry).filter((entry): entry is StandardEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function saveStandards(entries: StandardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const emptyRow = (): StandardRow => ({ materialId: "", quantity: "", note: "" });

export function JobStandardsClient({ materials, jobTypes }: JobStandardsClientProps) {
  const [jobType, setJobType] = useState(jobTypes[0] ?? "");
  const [rows, setRows] = useState<StandardRow[]>([emptyRow()]);
  const [entries, setEntries] = useState<StandardEntry[]>(() => loadStandards());
  const [status, setStatus] = useState<"idle" | "saved" | "validation" | "deleted">("idle");

  useEffect(() => {
    const validMaterialIds = new Set(materials.map((material) => material.id));

    setEntries((current) => {
      const cleaned = current.filter((entry) => validMaterialIds.has(entry.materialId));

      if (cleaned.length !== current.length) {
        saveStandards(cleaned);
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

  const grouped = useMemo(() => {
    const map = new Map<string, StandardEntry[]>();

    for (const entry of entries) {
      if (!map.has(entry.jobType)) {
        map.set(entry.jobType, []);
      }
      map.get(entry.jobType)?.push(entry);
    }

    return Array.from(map.entries())
      .map(([job, jobEntries]) => ({
        job,
        entries: [...jobEntries].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      }))
      .sort((a, b) => a.job.localeCompare(b.job));
  }, [entries]);

  const updateRow = (index: number, updates: Partial<StandardRow>) => {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (jobTypes.length === 0) {
      setStatus("validation");
      return;
    }

    const normalizedJobType = jobType.trim();
    if (!normalizedJobType) {
      setStatus("validation");
      return;
    }

    const nextEntries: StandardEntry[] = [];

    for (const row of rows) {
      const materialId = row.materialId.trim();
      const quantity = Number(row.quantity);
      const note = row.note.trim();
      const hasMaterial = Boolean(materialId);
      const hasQuantity = !Number.isNaN(quantity) && quantity > 0;

      if ((hasMaterial && !hasQuantity) || (!hasMaterial && hasQuantity)) {
        setStatus("validation");
        return;
      }

      if (!hasMaterial && !hasQuantity) {
        continue;
      }

      nextEntries.push({
        id: crypto.randomUUID(),
        jobType: normalizedJobType,
        materialId,
        quantity,
        ...(note ? { note } : {}),
        createdAt: new Date().toISOString(),
      });
    }

    if (nextEntries.length === 0) {
      setStatus("validation");
      return;
    }

    const updated = [...entries, ...nextEntries];
    setEntries(updated);
    saveStandards(updated);

    setJobType(jobTypes[0] ?? "");
    setRows([emptyRow()]);
    setStatus("saved");
  };

  const handleDelete = (entryId: string) => {
    const updated = entries.filter((entry) => entry.id !== entryId);
    setEntries(updated);
    saveStandards(updated);
    setStatus("deleted");
  };

  return (
    <>
      <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
        <h2 className="text-xl font-semibold">Set standard supplies per job type</h2>
        <p className="mt-2 text-sm text-slate-300">
          Define expected material counts for each build type.
        </p>

        {status === "saved" ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Job standard saved.
          </p>
        ) : null}

        {status === "deleted" ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Standard entry deleted.
          </p>
        ) : null}

        {status === "validation" ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Job type is required. For each filled row, include both material and quantity greater
            than zero. Add job types first if none are available.
          </p>
        ) : null}

        {jobTypes.length === 0 ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            No job types found. Add job types first in the Job Types page, then return here to set
            standards.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-cyan-200" htmlFor="jobType">
              Job Type
            </label>
            <select
              id="jobType"
              value={jobType}
              onChange={(event) => setJobType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            >
              {jobTypes.length === 0 ? <option value="">No job types found</option> : null}
              {jobTypes.map((typeName) => (
                <option key={typeName} value={typeName}>
                  {typeName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Manage available project names in the Job Types page.
            </p>
          </div>

          <div className="grid gap-3">
            {rows.map((row, index) => (
              <div
                key={`standard-row-${index}`}
                className="grid gap-3 rounded-xl border border-cyan-500/20 bg-[#111a2f]/70 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_auto]"
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Material
                  </label>
                  <select
                    value={row.materialId}
                    onChange={(event) => updateRow(index, { materialId: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">Select material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Standard Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(event) => updateRow(index, { quantity: event.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Note (Optional)
                  </label>
                  <input
                    value={row.note}
                    onChange={(event) => updateRow(index, { note: event.target.value })}
                    placeholder="Example: includes 10% overage"
                    className="mt-1 w-full rounded-lg border border-cyan-500/30 bg-[#050914] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#111a2f]"
            >
              Add Item Type
            </button>
            <button
              type="submit"
              disabled={jobTypes.length === 0}
              className="rounded-xl bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Save Standards
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
        <h2 className="text-xl font-semibold">Standard supply plans by job type</h2>

        {grouped.length === 0 ? (
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
            <p className="text-base font-medium text-white">No standards saved yet.</p>
            <p className="mt-2 text-sm text-slate-300">
              Add a standard plan above to define expected supply counts per job type.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {grouped.map((group) => (
              <div
                key={group.job}
                className="rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-white">{group.job}</p>
                  <p className="text-sm text-slate-300">
                    Standard items: {group.entries.length}
                  </p>
                </div>

                <div className="mt-3 grid gap-2">
                  {group.entries.map((entry) => {
                    const material = materialById[entry.materialId];

                    return (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {material?.name ?? "Unknown Material"} • {entry.quantity} items
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {material?.sku ?? "Unknown SKU"}
                            {entry.note ? ` • ${entry.note}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
