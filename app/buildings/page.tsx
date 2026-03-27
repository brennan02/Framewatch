import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBuildingInSupabase,
  deleteBuildingInSupabase,
  fetchBuildingsFromSupabase,
  fetchJobTypesFromSupabase,
} from "../src/lib/supabase";
import { PrintBuildingQrButton } from "../src/components/buildings/print-building-qr-button";

function buildSpecialId() {
  return `BLD-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

function buildQrValue(specialId: string, name: string) {
  return `FW-BLD:${specialId}:${name.trim()}`;
}

async function addBuildingAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const jobTypeName = String(formData.get("job_type_name") ?? "").trim();

  if (!name) {
    redirect("/buildings?status=validation");
  }

  const specialId = buildSpecialId();
  const qrValue = buildQrValue(specialId, name);

  const { error } = await createBuildingInSupabase({
    name,
    specialId,
    qrValue,
    ...(jobTypeName ? { jobTypeName } : {}),
  });

  if (error) {
    redirect(`/buildings?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/buildings");
  revalidatePath("/jobs");
  redirect("/buildings?status=success");
}

async function deleteBuildingAction(formData: FormData) {
  "use server";

  const buildingId = String(formData.get("building_id") ?? "").trim();
  if (!buildingId) {
    redirect("/buildings?status=error&message=Missing building ID");
  }

  const { error } = await deleteBuildingInSupabase(buildingId);

  if (error) {
    redirect(`/buildings?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/buildings");
  revalidatePath("/jobs");
  redirect("/buildings?status=deleted");
}

type BuildingsPageProps = {
  searchParams?: {
    status?: string;
    message?: string;
  };
};

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const params = searchParams ?? {};
  const [{ data: buildings, error }, { data: jobTypes }] = await Promise.all([
    fetchBuildingsFromSupabase(),
    fetchJobTypesFromSupabase(),
  ]);

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Buildings
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Building IDs + QR Codes</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Create a special ID and QR for each building so crews can scan and load the building
              in job workflows.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
          >
            Back to Jobs
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Create building QR</h2>
          <p className="mt-2 text-sm text-slate-300">
            Add a building and we will generate a unique special ID and QR payload.
          </p>

          {params.status === "success" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Building QR created.
            </p>
          ) : null}

          {params.status === "deleted" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Building deleted.
            </p>
          ) : null}

          {params.status === "validation" ? (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Building name is required.
            </p>
          ) : null}

          {params.status === "error" ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Unable to process request. {params.message ?? "Please try again."}
            </p>
          ) : null}

          <form action={addBuildingAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Building Name *</span>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. UG 12x40 - Lot 3"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Job Type (optional)</span>
              <select
                name="job_type_name"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white focus:border-cyan-300 focus:outline-none"
              >
                <option value="">None</option>
                {jobTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                Create Building ID + QR
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          {error ? (
            <p className="text-sm leading-6 text-amber-200">
              Unable to load buildings from Supabase right now. {error}
            </p>
          ) : null}

          {buildings.length === 0 ? (
            <div className="rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
              <p className="text-lg font-semibold text-white">No buildings yet</p>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Create a building above to generate a special ID and QR code.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Saved buildings</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {buildings.map((building) => (
                  <div
                    key={building.id}
                    className="rounded-xl border border-cyan-500/20 bg-[#050914] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{building.name}</p>
                        <p className="mt-1 text-xs text-cyan-300">{building.specialId}</p>
                        {building.jobTypeName ? (
                          <p className="mt-1 text-xs text-slate-400">Type: {building.jobTypeName}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <PrintBuildingQrButton
                          buildingName={building.name}
                          specialId={building.specialId}
                          qrValue={building.qrValue}
                        />
                        <form action={deleteBuildingAction}>
                          <input type="hidden" name="building_id" value={building.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 p-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(building.qrValue)}`}
                        alt={`QR code for ${building.name}`}
                        className="h-40 w-40 rounded-lg border border-cyan-500/20 bg-white p-2"
                      />
                      <p className="mt-2 break-all text-xs text-slate-400">{building.qrValue}</p>
                    </div>
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
