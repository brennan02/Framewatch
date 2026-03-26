"use client";

import Link from "next/link";
import { useDemoState } from "../src/components/demo-state-provider";
import { materials } from "../src/lib/mock-data";

const wasteActions = new Set(["waste", "partial", "salvaged"]);

export default function ReportsPage() {
  const { logs } = useDemoState();

  const materialNameById = materials.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const wasteRelatedLogs = logs
    .filter((log) => wasteActions.has(log.action))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalWasteQuantity = wasteRelatedLogs
    .filter((log) => log.action === "waste")
    .reduce((sum, log) => sum + log.quantity, 0);

  const totalSalvagedQuantity = wasteRelatedLogs
    .filter((log) => log.action === "salvaged")
    .reduce((sum, log) => sum + log.quantity, 0);

  const totalPartialQuantity = wasteRelatedLogs
    .filter((log) => log.action === "partial")
    .reduce((sum, log) => sum + log.quantity, 0);

  const wasteByMaterial = Object.entries(
    wasteRelatedLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.action !== "waste") {
        return acc;
      }

      acc[log.materialId] = (acc[log.materialId] ?? 0) + log.quantity;
      return acc;
    }, {})
  )
    .map(([materialId, total]) => ({
      materialId,
      materialName: materialNameById[materialId] ?? "Unknown Material",
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const maxWasteMaterialTotal = wasteByMaterial[0]?.total ?? 0;

  const wasteByJob = Object.entries(
    wasteRelatedLogs.reduce<Record<string, number>>((acc, log) => {
      if (log.action !== "waste") {
        return acc;
      }

      const jobName = log.jobName?.trim();
      if (!jobName) {
        return acc;
      }

      acc[jobName] = (acc[jobName] ?? 0) + log.quantity;
      return acc;
    }, {})
  )
    .map(([jobName, total]) => ({ jobName, total }))
    .sort((a, b) => b.total - a.total);

  const maxWasteJobTotal = wasteByJob[0]?.total ?? 0;

  const stats = [
    { label: "Total Waste Qty", value: totalWasteQuantity },
    { label: "Total Salvaged Qty", value: totalSalvagedQuantity },
    { label: "Total Partial-Use Qty", value: totalPartialQuantity },
    { label: "Waste-Related Entries", value: wasteRelatedLogs.length },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Reports
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Waste & Material Loss</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Demo-focused reporting for Tuckertown Buildings to quickly show where
              waste is happening and where salvage is offsetting loss.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              View Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              Back Home
            </Link>
          </div>
        </div>

        {wasteRelatedLogs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <h2 className="text-xl font-semibold">No waste activity yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Add waste, partial-use, or salvaged entries from the scan flow to populate
              this report and demo material-loss visibility.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/scan"
                className="rounded-xl border border-amber-500 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
              >
                Open Scan Flow
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                >
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold">Top Waste Materials</h2>

                {wasteByMaterial.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    No direct waste entries logged yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {wasteByMaterial.map((item) => {
                      const width =
                        maxWasteMaterialTotal > 0
                          ? Math.round((item.total / maxWasteMaterialTotal) * 100)
                          : 0;

                      return (
                        <div
                          key={item.materialId}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium text-white">{item.materialName}</p>
                            <p className="text-lg font-bold text-amber-300">{item.total}</p>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-amber-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold">Waste by Job</h2>

                {wasteByJob.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Waste entries with job names have not been logged yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {wasteByJob.map((item) => {
                      const width =
                        maxWasteJobTotal > 0
                          ? Math.round((item.total / maxWasteJobTotal) * 100)
                          : 0;

                      return (
                        <div
                          key={item.jobName}
                          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium text-white">{item.jobName}</p>
                            <p className="text-lg font-bold text-amber-300">{item.total}</p>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-amber-400"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">Recent Waste Activity</h2>

              <div className="mt-4 space-y-3">
                {wasteRelatedLogs.slice(0, 8).map((entry) => {
                  const isWaste = entry.action === "waste";
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl border px-4 py-3 ${
                        isWaste
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-white">
                          {materialNameById[entry.materialId] ?? "Unknown Material"}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${
                            isWaste
                              ? "border-amber-400/60 text-amber-300"
                              : "border-slate-700 text-slate-300"
                          }`}
                        >
                          {entry.action}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        Quantity: {entry.quantity}
                        {entry.jobName ? ` • Job: ${entry.jobName}` : ""}
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-xs text-slate-400">{entry.note}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
