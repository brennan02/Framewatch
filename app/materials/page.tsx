import Link from "next/link";
import { TopNavLinks } from "../src/components/top-nav-links";
import { fetchMaterialsFromSupabase } from "../src/lib/supabase";

export default async function MaterialsPage() {
  const { data: materials, error } = await fetchMaterialsFromSupabase();
  const hasMaterials = materials.length > 0;

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Materials
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Tuckertown material catalog
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Live materials list sourced from Supabase.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-5">
          <TopNavLinks currentPath="/materials" />
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          {error ? (
            <p className="text-sm leading-6 text-amber-200">
              Unable to load materials from Supabase right now. {error}
            </p>
          ) : null}

          {!hasMaterials ? (
            <div className="rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
              <p className="text-lg font-semibold text-white">No materials yet</p>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Your materials table is connected, but there are no records to display yet.
              </p>
            </div>
          ) : (
            <>
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
                    className="grid gap-2 rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-3 transition hover:border-cyan-400/60 hover:bg-[#111a2f] sm:grid-cols-5"
                  >
                    <p className="font-medium text-white">{material.name}</p>
                    <p className="text-sm text-slate-300">{material.sku}</p>
                    <p className="text-sm capitalize text-slate-300">{material.category}</p>
                    <p className="text-sm text-slate-300">{material.unit}</p>
                    <p className="text-sm text-slate-300">{material.color ?? "—"}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
