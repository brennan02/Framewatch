import {
  fetchMaterialsFromSupabase,
  fetchWasteLogsFromSupabase,
} from "../src/lib/supabase";
import { deleteWasteAction } from "../src/actions/waste";
import { WasteForm } from "../src/components/waste-form";
import type { WasteLog } from "../src/types/waste";

type Material = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
};

export default async function WastePage(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status;
  const message = searchParams.message;

  const { data: materials } = await fetchMaterialsFromSupabase();
  const { data: wasteLogsData } = await fetchWasteLogsFromSupabase();

  const wasteLogs: WasteLog[] = wasteLogsData || [];

  // Get waste summary by material
  const wasteSummary = new Map<string, { count: number; material: Material | undefined }>();
  wasteLogs.forEach((log) => {
    const current = wasteSummary.get(log.materialId) || { count: 0, material: undefined };
    const material = materials?.find((m: Material) => m.id === log.materialId);
    wasteSummary.set(log.materialId, {
      count: current.count + log.quantity,
      material,
    });
  });

  const topWasteItems = Array.from(wasteSummary.entries())
    .map(([materialId, { count, material }]) => ({
      materialId,
      materialName: material?.name || "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#050914] to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Waste Tracking</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track defective and damaged materials
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-red-400/20 bg-gradient-to-br from-red-500/5 to-slate-900/20 p-6">
              <h2 className="mb-5 text-base font-semibold text-red-200">
                Log Waste
              </h2>
              <WasteForm
                status={status}
                message={message}
              />
            </div>
          </div>

          {/* Dashboard Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Waste Items */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
              <h2 className="mb-4 text-base font-semibold text-white">
                Top Waste Materials
              </h2>

              {topWasteItems.length === 0 ? (
                <p className="text-slate-400">No waste logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {topWasteItems.map((item) => (
                    <div
                      key={item.materialId}
                      className="rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-3 flex items-center justify-between"
                    >
                      <p className="font-medium text-white text-sm">
                        {item.materialName}
                      </p>
                      <p className="text-lg font-bold text-red-300">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Waste Logs */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
              <h2 className="mb-4 text-base font-semibold text-white">
                Waste History
              </h2>

              {wasteLogs.length === 0 ? (
                <p className="text-slate-400">No waste logged yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {wasteLogs.map((log) => {
                    const material = materials?.find((m: Material) => m.id === log.materialId);
                    const reasonLabel = log.defectReason.charAt(0).toUpperCase() + log.defectReason.slice(1);

                    return (
                      <div
                        key={log.id}
                        className="rounded-lg border border-slate-700/30 bg-slate-800/20 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-white">
                            {material?.name || "Unknown"}
                          </p>
                          <p className="text-red-300 font-bold">
                            {log.quantity} board{log.quantity !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          Reason: <span className="text-red-300">{reasonLabel}</span>
                        </p>
                        {log.jobName && (
                          <p className="text-xs text-slate-400 mt-1">
                            Job: {log.jobName}
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-xs text-slate-400 mt-1">
                            {log.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleDateString()} at{" "}
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                          <form action={deleteWasteAction}>
                            <input type="hidden" name="waste_log_id" value={log.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-400 hover:text-red-300 underline"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
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
