import Link from "next/link";
import { materials } from "../src/lib/mock-data";

export default function MaterialsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Materials
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Tuckertown material catalog
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Current MVP materials list sourced from local mock data.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
          >
            Back Dashboard
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="grid gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid-cols-5">
            <p>Name</p>
            <p>SKU</p>
            <p>Category</p>
            <p>Unit</p>
            <p>Color</p>
          </div>

          <div className="mt-4 space-y-3">
            {materials.map((material) => (
              <Link
                key={material.id}
                href={`/materials/${material.id}`}
                className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 transition hover:border-amber-500/60 hover:bg-slate-900 sm:grid-cols-5"
              >
                <p className="font-medium text-white">{material.name}</p>
                <p className="text-sm text-slate-300">{material.sku}</p>
                <p className="text-sm capitalize text-slate-300">{material.category}</p>
                <p className="text-sm text-slate-300">{material.unit}</p>
                <p className="text-sm text-slate-300">{material.color ?? "—"}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
