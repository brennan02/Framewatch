import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TopNavLinks } from "../src/components/top-nav-links";
import {
  createUnitInSupabase,
  deleteUnitInSupabase,
  fetchUnitsFromSupabase,
} from "../src/lib/supabase";

async function addUnitAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirect("/units?status=validation&field=name");
  }

  const { error } = await createUnitInSupabase(name, description || undefined);

  if (error) {
    redirect(`/units?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/units");
  revalidatePath("/materials");
  redirect("/units?status=success");
}

async function deleteUnitAction(formData: FormData) {
  "use server";

  const unitName = String(formData.get("unit_name") ?? "").trim();
  if (!unitName) {
    redirect("/units?status=error&message=Missing unit name");
  }

  const { error } = await deleteUnitInSupabase(unitName);

  if (error) {
    redirect(`/units?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/units");
  revalidatePath("/materials");
  redirect("/units?status=deleted");
}

type UnitsPageProps = {
  searchParams?: {
    status?: string;
    field?: string;
    message?: string;
  };
};

export default async function UnitsPage({ searchParams }: UnitsPageProps) {
  const params = searchParams ?? {};
  const { data: units, error } = await fetchUnitsFromSupabase();
  const hasUnits = units.length > 0;

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Units
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Measurement units
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Manage measurement units for material tracking (feet, pounds, sheets, etc).
            </p>
          </div>

          <Link
            href="/materials"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
          >
            Back to Materials
          </Link>
        </div>
        <div className="mt-5">
          <TopNavLinks currentPath="/units" />
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Add Unit</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create a new measurement unit.
          </p>

          {params.status === "success" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Unit added successfully.
            </p>
          ) : null}

          {params.status === "deleted" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Unit deleted successfully.
            </p>
          ) : null}

          {params.status === "validation" && params.field === "name" ? (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Unit name is required.
            </p>
          ) : null}

          {params.status === "error" ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Unable to add unit right now. {params.message ?? "Please try again."}
            </p>
          ) : null}

          <form action={addUnitAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Unit Name *</span>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Feet, Pounds, Sheets"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Description (optional)</span>
              <input
                name="description"
                type="text"
                placeholder="e.g. Linear feet of lumber"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                Add Unit
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          {error ? (
            <p className="text-sm leading-6 text-amber-200">
              Unable to load units from Supabase right now. {error}
            </p>
          ) : null}

          {!hasUnits ? (
            <div className="rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
              <p className="text-lg font-semibold text-white">No units yet</p>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Create your first unit above to get started.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Units</h2>
              <div className="mt-4 space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit}
                    className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-3 transition hover:border-cyan-400/60 hover:bg-[#111a2f]"
                  >
                    <p className="font-medium text-white">{unit}</p>

                    <form action={deleteUnitAction} className="flex-shrink-0">
                      <input type="hidden" name="unit_name" value={unit} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
