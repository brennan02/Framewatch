import { UsedMaterialForm } from "../src/components/used-material-form";
import { AllocateForm } from "../src/components/allocate-materials-form";
import { fetchMaterialsFromSupabase, fetchUsedMaterialLogsFromSupabase, fetchUnitsFromSupabase } from "../src/lib/supabase";

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

export default async function UsedMaterialsPage(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status;
  const message = searchParams.message;
  const searchSize = searchParams.searchSize ? parseFloat(searchParams.searchSize) : null;
  const searchUnit = searchParams.searchUnit || null;

  // Fetch data from Supabase
  const { data: materials, error: materialsError } = await fetchMaterialsFromSupabase();
  const { data: usedMaterialLogs, error: logsError } = await fetchUsedMaterialLogsFromSupabase();
  const { data: units, error: unitsError } = await fetchUnitsFromSupabase();

  // Create a map of material IDs to names for easy lookup
  const materialMap = new Map<string, Material>();
  if (materials) {
    materials.forEach((mat: Material) => {
      materialMap.set(mat.id, mat);
    });
  }

  // Group entries by material ID, size, and unit
  const groupedLogs = new Map<string, GroupedLog>();
  if (usedMaterialLogs) {
    usedMaterialLogs.forEach((log) => {
      const key = `${log.materialId}|${log.size}|${log.unit}`;
      if (groupedLogs.has(key)) {
        const existing = groupedLogs.get(key)!;
        existing.totalQuantity += log.quantity;
        if (log.jobName && !existing.jobNames.includes(log.jobName)) {
          existing.jobNames.push(log.jobName);
        }
      } else {
        groupedLogs.set(key, {
          ...log,
          totalQuantity: log.quantity,
          jobNames: log.jobName ? [log.jobName] : [],
        });
      }
    });
  }

  const groupedLogsList = Array.from(groupedLogs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter by search size and unit
  const filteredLogs = groupedLogsList.filter((log) => {
    if (!searchSize || !searchUnit) return true;
    if (log.unit !== searchUnit) return false;
    const logSize = parseFloat(log.size);
    return logSize >= searchSize;
  });

  const totalLogged = groupedLogsList.length;
  const totalQuantity = groupedLogsList.reduce((sum, log) => sum + log.totalQuantity, 0);
  const searchResults = filteredLogs.length;

  // Sort filtered logs by size for allocation (smallest to largest)
  const sortedBySize = [...filteredLogs].sort((a, b) => {
    const sizeA = parseFloat(a.size);
    const sizeB = parseFloat(b.size);
    return sizeA - sizeB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#050914] to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Used Materials</h1>
          <p className="mt-1 text-sm text-slate-400">
            Log scraps and salvage materials that can be reused for other projects. Each piece is its own entry with custom size and unit.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border border-green-400/20 bg-green-500/5 p-4">
            <div className="text-sm font-semibold text-green-300">Entries Logged</div>
            <div className="mt-2 text-2xl font-bold text-white">{totalLogged}</div>
          </div>
          <div className="rounded-xl border border-green-400/20 bg-green-500/5 p-4">
            <div className="text-sm font-semibold text-green-300">Total Units</div>
            <div className="mt-2 text-2xl font-bold text-white">{totalQuantity}</div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8 rounded-xl border border-cyan-400/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Search for Available Boards</h2>
          <form method="get" className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Minimum Size
              </label>
              <input
                type="number"
                name="searchSize"
                defaultValue={searchSize || ""}
                step="0.1"
                placeholder="e.g., 4, 6, 8"
                className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Unit
              </label>
              <select
                name="searchUnit"
                defaultValue={searchUnit || ""}
                className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Select unit...</option>
                {units && units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-6 py-2 font-semibold text-cyan-200 hover:bg-cyan-500/20 text-sm"
            >
              Search
            </button>
            {(searchSize || searchUnit) && (
              <a
                href="/used-materials"
                className="rounded-lg border border-slate-400/40 bg-slate-500/10 px-6 py-2 font-semibold text-slate-200 hover:bg-slate-500/20 text-sm"
              >
                Clear
              </a>
            )}
          </form>
          {searchSize && searchUnit && (
            <p className="mt-3 text-sm text-slate-300">
              Found <span className="text-green-300 font-semibold">{searchResults}</span> board(s) that are{" "}
              <span className="text-cyan-300">{searchSize}+ {searchUnit}</span>
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="rounded-xl border border-cyan-400/20 bg-[#0c1426]/80 p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Log Used Material</h2>
            <UsedMaterialForm status={status} message={message} />
          </div>

          {/* Recent Entries & Allocation */}
          <div className="lg:col-span-2 space-y-8">
            {/* Allocation Section */}
            {searchSize && searchUnit && sortedBySize.length > 0 && (
              <div className="rounded-xl border border-blue-400/20 bg-[#0c1426]/80 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Allocate Materials</h2>
                <AllocateForm
                  filteredLogs={sortedBySize}
                  materialMap={materialMap}
                  searchSize={searchSize}
                  searchUnit={searchUnit}
                />
              </div>
            )}

            {/* Recent Entries */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                Recent Entries {searchSize && searchUnit && <span className="text-sm text-slate-400">(Filtered)</span>}
              </h2>
              <div className="space-y-3">
                {(searchSize && searchUnit ? filteredLogs : groupedLogsList).length > 0 ? (
                  (searchSize && searchUnit ? filteredLogs : groupedLogsList).map((entry, idx) => {
                    const material = materialMap.get(entry.materialId);
                    return (
                      <div
                        key={`${entry.materialId}|${entry.size}|${entry.unit}|${idx}`}
                        className="rounded-lg border border-cyan-400/20 bg-[#0c1426]/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {material?.name || `Material (${entry.materialId})`}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              Size: <span className="text-cyan-300">{entry.size} {entry.unit}</span>
                              {" | "}
                              Total Quantity: <span className="text-green-300 font-semibold">{entry.totalQuantity}</span>
                              {entry.jobNames.length > 0 && (
                                <>
                                  {" | "}
                                  From: <span className="text-cyan-300">{entry.jobNames.join(", ")}</span>
                                </>
                              )}
                            </p>
                            {entry.notes && (
                              <p className="mt-2 text-sm text-slate-300">{entry.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                              {new Date(entry.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-cyan-400/10 bg-[#0c1426]/40 p-6 text-center">
                    <p className="text-slate-400">No entries yet. Start logging used materials and scraps!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
