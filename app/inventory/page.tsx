import {
  fetchMaterialsFromSupabase,
  fetchInventoryLogsFromSupabase,
} from "../src/lib/supabase";
import { InventoryForm } from "../src/components/inventory-form";
import type { InventoryLog, InventoryAction } from "../src/types/inventory";

type Material = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

type CurrentInventory = {
  materialId: string;
  materialName: string;
  sku: string;
  category: string;
  unit: string;
  currentPieces: number;
};

export default async function InventoryPage(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status;
  const message = searchParams.message;

  const { data: materials } = await fetchMaterialsFromSupabase();
  const { data: logsData } = await fetchInventoryLogsFromSupabase();

  // Transform returned logs to match InventoryLog type if needed
  const logs: InventoryLog[] = (logsData || []).map((log: Record<string, unknown>) => ({
    id: log.id as string,
    materialId: (log.material_id || log.materialId) as string,
    action: log.action as InventoryAction,
    quantity: log.quantity as number,
    jobName: (log.job_name || log.jobName) as string | undefined,
    note: log.note as string | undefined,
    createdAt: (log.created_at || log.createdAt) as string,
  }));

  // Calculate current inventory for each material
  const inventoryMap = new Map<string, number>();

  if (logs?.length) {
    logs.forEach((log: InventoryLog) => {
      const current = inventoryMap.get(log.materialId) || 0;
      inventoryMap.set(log.materialId, current + log.quantity);
    });
  }

  const currentInventory: CurrentInventory[] = (materials || [])
    .map((mat: Material) => ({
      materialId: mat.id,
      materialName: mat.name,
      sku: mat.sku,
      category: mat.category,
      unit: mat.unit,
      currentPieces: inventoryMap.get(mat.id) || 0,
    }))
    .sort((a: CurrentInventory, b: CurrentInventory) => a.materialName.localeCompare(b.materialName));

  // Get recent logs
  const recentLogs = logs
    .sort(
      (a: InventoryLog, b: InventoryLog) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
    .map((log: InventoryLog) => {
      const material = materials?.find((m: Material) => m.id === log.materialId);
      return {
        id: log.id,
        materialName: material?.name || "Unknown",
        action: log.action,
        quantity: log.quantity,
        jobName: log.jobName,
        createdAt: new Date(log.createdAt),
      };
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#050914] to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Inventory Tracking</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage piece count for materials
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-slate-900/20 p-6">
              <h2 className="mb-5 text-base font-semibold text-cyan-200">
                Add/Subtract Pieces
              </h2>
              <InventoryForm
                status={status}
                message={message}
              />
            </div>
          </div>

          {/* Dashboard Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Inventory Grid */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
              <h2 className="mb-4 text-base font-semibold text-white">
                Current Inventory
              </h2>

              {currentInventory.length === 0 ? (
                <p className="text-slate-400">No materials found.</p>
              ) : (
                <div className="grid gap-2">
                  {currentInventory.map((inv) => {
                    const stockLevel =
                      inv.currentPieces === 0
                        ? "text-red-300"
                        : inv.currentPieces < 10
                          ? "text-yellow-300"
                          : "text-emerald-300";

                    return (
                      <div
                        key={inv.materialId}
                        className="rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {inv.materialName}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            SKU: {inv.sku} • {inv.category} • {inv.unit}
                          </p>
                        </div>
                        <div className={`text-right ${stockLevel}`}>
                          <p className="text-2xl font-bold">
                            {inv.currentPieces}
                          </p>
                          <p className="text-xs text-slate-400">piece{inv.currentPieces !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
              <h2 className="mb-4 text-base font-semibold text-white">
                Recent Activity
              </h2>

              {recentLogs.length === 0 ? (
                <p className="text-slate-400">No transactions yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {recentLogs.map((log) => {
                    const isAdd = log.quantity > 0;
                    const color = isAdd ? "text-emerald-300" : "text-orange-300";
                    const sign = isAdd ? "+" : "";

                    return (
                      <div
                        key={log.id}
                        className="rounded-lg border border-slate-700/30 bg-slate-800/20 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white text-sm">
                            {log.materialName}
                          </p>
                          <p className={`font-bold text-sm ${color}`}>
                            {sign}
                            {Math.abs(log.quantity)} ({log.action})
                          </p>
                        </div>
                        {log.jobName && (
                          <p className="text-xs text-slate-400 mt-2">
                            Job: {log.jobName}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {log.createdAt.toLocaleDateString()} at{" "}
                          {log.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
