import Link from "next/link";
import { inventoryLogs } from "../../src/lib/mock-data";
import { fetchMaterialByIdFromSupabase } from "../../src/lib/supabase";
import type { InventoryAction } from "../../src/types/inventory";

type MaterialDetailPageProps = {
  params: Promise<{
    materialId: string;
  }>;
};

const summaryActions: InventoryAction[] = ["in", "out", "waste", "salvaged"];

const formatActionLabel = (action: InventoryAction) =>
  action.charAt(0).toUpperCase() + action.slice(1);

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
  const { materialId } = await params;
  const { data: material } = await fetchMaterialByIdFromSupabase(materialId);

  if (!material) {
    return (
      <main className="min-h-screen bg-[#050914] text-white">
        <section className="mx-auto w-full max-w-4xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Materials
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Material not found</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            We couldn&apos;t find a material with ID <span className="font-mono">{materialId}</span>.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/materials"
              className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
            >
              Back to Materials
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const materialLogs = inventoryLogs
    .filter((log) => log.materialId === material.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const summaryStats = summaryActions.map((action) => ({
    action,
    total: materialLogs
      .filter((log) => log.action === action)
      .reduce((sum, log) => sum + log.quantity, 0),
  }));

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Material Detail
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{material.name}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              SKU {material.sku} • {material.category} • {material.unit}
            </p>
          </div>

          <Link
            href="/materials"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
          >
            Back to Materials
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5">
            <p className="text-sm text-slate-400">Category</p>
            <p className="mt-2 text-xl font-semibold capitalize">{material.category}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5">
            <p className="text-sm text-slate-400">Unit</p>
            <p className="mt-2 text-xl font-semibold">{material.unit}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5">
            <p className="text-sm text-slate-400">Color</p>
            <p className="mt-2 text-xl font-semibold capitalize">{material.color ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-xl font-semibold">
              {material.active ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5 sm:col-span-2 lg:col-span-2">
            <p className="text-sm text-slate-400">SKU</p>
            <p className="mt-2 text-xl font-semibold">{material.sku}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Material QR Code</h2>
          <p className="mt-2 text-sm text-slate-400">
            Scan value: <span className="font-mono text-white">{material.scanCode}</span>
          </p>
          <div className="mt-4 inline-block rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(material.scanCode || material.sku)}`}
              alt={`QR code for ${material.name}`}
              width={220}
              height={220}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Material summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((stat) => (
              <div
                key={stat.action}
                className="rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total logged {formatActionLabel(stat.action)}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{stat.total}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Recent logs for this material</h2>

          {materialLogs.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">
              No logs found yet for this material.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {materialLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-cyan-400/30 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                      {log.action}
                    </span>
                    <p className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">
                    Quantity: {log.quantity}
                    {log.jobName ? ` • Job: ${log.jobName}` : ""}
                  </p>
                  {log.note ? <p className="mt-1 text-xs text-slate-400">{log.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
