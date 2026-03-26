import Link from "next/link";
import { inventoryLogs, materials } from "../src/lib/mock-data";
import type { InventoryAction } from "../src/types/inventory";

const formatActionLabel = (action: InventoryAction) =>
  action.charAt(0).toUpperCase() + action.slice(1);

const actionOrder: InventoryAction[] = [
  "in",
  "out",
  "partial",
  "waste",
  "salvaged",
];

export default function DashboardPage() {
  const materialNameById = materials.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const actionTotals = actionOrder.map((action) => {
    const total = inventoryLogs
      .filter((log) => log.action === action)
      .reduce((sum, log) => sum + log.quantity, 0);

    return { action, total };
  });

  const materialsIn = actionTotals.find((item) => item.action === "in")?.total ?? 0;
  const materialsOut = actionTotals.find((item) => item.action === "out")?.total ?? 0;
  const wasteEvents = inventoryLogs.filter((log) => log.action === "waste");
  const salvagedItems =
    actionTotals.find((item) => item.action === "salvaged")?.total ?? 0;

  const materialActivity = Object.entries(
    inventoryLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.materialId] = (acc[log.materialId] ?? 0) + log.quantity;
      return acc;
    }, {})
  )
    .map(([materialId, total]) => ({
      materialId,
      materialName: materialNameById[materialId] ?? "Unknown Material",
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const jobActivity = Object.entries(
    inventoryLogs.reduce<Record<string, number>>((acc, log) => {
      const jobName = log.jobName?.trim();
      if (!jobName) {
        return acc;
      }

      acc[jobName] = (acc[jobName] ?? 0) + log.quantity;
      return acc;
    }, {})
  )
    .map(([jobName, total]) => ({ jobName, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentActivity = [...inventoryLogs]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6)
    .map((log) => ({
      ...log,
      materialName: materialNameById[log.materialId] ?? "Unknown Material",
    }));

  const stats = [
    { label: "Materials Logged In", value: String(materialsIn) },
    { label: "Materials Used", value: String(materialsOut) },
    { label: "Waste Events", value: String(wasteEvents.length) },
    { label: "Salvaged Items", value: String(salvagedItems) },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              FrameWatch overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Early MVP dashboard for Tuckertown Buildings material usage, waste,
              and loss visibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/materials"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              View Materials
            </Link>

            <Link
              href="/jobs"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              View Jobs
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              Back Home
            </Link>
          </div>
        </div>

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
            <h2 className="text-xl font-semibold">Inventory Activity by Action</h2>
            <div className="mt-4 space-y-3">
              {actionTotals.map((item) => {
                const isWaste = item.action === "waste";
                return (
                  <div
                    key={item.action}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      isWaste
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <p className="font-medium text-white">{formatActionLabel(item.action)}</p>
                    <p
                      className={`text-lg font-bold ${
                        isWaste ? "text-amber-400" : "text-slate-100"
                      }`}
                    >
                      {item.total}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Top Material Activity</h2>
            {materialActivity.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">
                No material activity has been logged yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {materialActivity.map((item, index) => (
                  <div
                    key={item.materialId}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-white">{item.materialName}</p>
                      <p className="text-sm font-semibold text-slate-300">
                        #{index + 1}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">Total logged quantity</p>
                    <p className="mt-2 text-lg font-bold text-white">{item.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Jobs with Most Activity</h2>
            {jobActivity.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">
                No job activity has been logged yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {jobActivity.map((item) => (
                  <div
                    key={item.jobName}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <p className="font-medium text-white">{item.jobName}</p>
                    <p className="text-lg font-bold text-slate-100">{item.total}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>

            {recentActivity.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">
                No activity has been logged yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentActivity.map((item) => {
                  const isWaste = item.action === "waste";
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-4 py-3 ${
                        isWaste
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-white">{item.materialName}</p>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs uppercase tracking-wide ${
                            isWaste
                              ? "border-amber-400/60 text-amber-300"
                              : "border-slate-700 text-slate-300"
                          }`}
                        >
                          {item.action}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-300">
                        Quantity: {item.quantity}
                        {item.jobName ? ` • Job: ${item.jobName}` : ""}
                      </p>

                      {item.note ? (
                        <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
