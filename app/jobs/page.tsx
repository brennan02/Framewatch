import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteBuildingInSupabase,
  createBuildingInSupabase,
  createInventoryLogInSupabase,
  deleteInventoryLogInSupabase,
  deleteUsedMaterialLogsByJobNameInSupabase,
  deleteWasteLogsByJobNameInSupabase,
  fetchBuildingsFromSupabase,
  fetchInventoryLogsFromSupabase,
  fetchJobSupplyStandardsFromSupabase,
  fetchMaterialsFromSupabase,
  updateInventoryLogInSupabase,
} from "../src/lib/supabase";
import { JobUsageForm } from "../src/components/jobs/job-usage-form";
import { JobStandardComparison } from "../src/components/jobs/job-standard-comparison";

function buildSpecialId() {
  return `BLD-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

function buildBuildingQrValue(specialId: string, name: string) {
  return `FW-BLD:${specialId}:${name.trim()}`;
}

type JobSummary = {
  jobName: string;
  totalUsageEntries: number;
  totalSuppliesUsed: number;
  supplies: Array<{
    materialId: string;
    materialName: string;
    quantityUsed: number;
  }>;
  entries: Array<{
    id: string;
    materialId: string;
    materialName: string;
    quantityUsed: number;
    createdAt: string;
    note?: string;
  }>;
};

async function logJobSupplyUsageAction(formData: FormData) {
  "use server";

  const jobName = String(formData.get("job_name") ?? "").trim();
  const materialIds = formData
    .getAll("material_id")
    .map((value) => String(value ?? "").trim());
  const quantities = formData
    .getAll("quantity")
    .map((value) => Number(String(value ?? "").trim()));
  const notes = formData
    .getAll("note")
    .map((value) => String(value ?? "").trim());

  if (!jobName) {
    redirect("/jobs?status=validation");
  }

  const maxRows = Math.max(materialIds.length, quantities.length, notes.length);
  const usageRows: Array<{ materialId: string; quantity: number; note?: string }> = [];

  for (let i = 0; i < maxRows; i += 1) {
    const materialId = materialIds[i] ?? "";
    const quantity = quantities[i];
    const note = notes[i] ?? "";

    const hasMaterial = Boolean(materialId);
    const hasQuantity = !Number.isNaN(quantity) && quantity > 0;

    // If row is partially filled, require both material and quantity.
    if ((hasMaterial && !hasQuantity) || (!hasMaterial && hasQuantity)) {
      redirect("/jobs?status=validation");
    }

    if (!hasMaterial && !hasQuantity) {
      continue;
    }

    usageRows.push({
      materialId,
      quantity: -Math.abs(quantity),
      ...(note ? { note } : {}),
    });
  }

  if (usageRows.length === 0) {
    redirect("/jobs?status=validation");
  }

  // Keep Buildings synced with Jobs: if this building name does not exist yet,
  // create it so the generated special ID and QR can be used later.
  const { data: existingBuildings, error: buildingFetchError } = await fetchBuildingsFromSupabase();
  if (buildingFetchError) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(buildingFetchError)}`);
  }

  const hasBuilding = existingBuildings.some(
    (building) => building.name.trim().toLowerCase() === jobName.toLowerCase(),
  );

  if (!hasBuilding) {
    const specialId = buildSpecialId();
    const qrValue = buildBuildingQrValue(specialId, jobName);
    const createBuildingResult = await createBuildingInSupabase({
      name: jobName,
      specialId,
      qrValue,
    });

    if (createBuildingResult.error) {
      redirect(`/jobs?status=error&message=${encodeURIComponent(createBuildingResult.error)}`);
    }
  }

  for (const row of usageRows) {
    const result = await createInventoryLogInSupabase({
      materialId: row.materialId,
      action: "out",
      // Usage should reduce inventory, so this is stored as a negative movement.
      quantity: row.quantity,
      jobName,
      ...(row.note ? { note: row.note } : {}),
    });

    if (result.error) {
      redirect(`/jobs?status=error&message=${encodeURIComponent(result.error)}`);
    }
  }

  revalidatePath("/jobs");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/buildings");
  redirect("/jobs?status=success");
}

async function deleteJobUsageEntryAction(formData: FormData) {
  "use server";

  const logId = String(formData.get("log_id") ?? "").trim();
  if (!logId) {
    redirect("/jobs?status=error&message=Missing usage entry ID");
  }

  const result = await deleteInventoryLogInSupabase(logId);
  if (result.error) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/jobs");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/jobs?status=deleted");
}

async function updateJobUsageEntryAction(formData: FormData) {
  "use server";

  const logId = String(formData.get("log_id") ?? "").trim();
  const materialId = String(formData.get("material_id") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "").trim());
  const note = String(formData.get("note") ?? "").trim();

  if (!logId) {
    redirect("/jobs?status=error&message=Missing usage entry ID");
  }

  if (!materialId || Number.isNaN(quantity) || quantity <= 0) {
    redirect("/jobs?status=validation");
  }

  const updateResult = await updateInventoryLogInSupabase(logId, {
    material_id: materialId,
    action: "out",
    quantity: -Math.abs(quantity),
    note: note || null,
  });

  if (updateResult.error) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(updateResult.error)}`);
  }

  revalidatePath("/jobs");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/jobs?status=updated");
}

async function deleteJobUsageProjectAction(formData: FormData) {
  "use server";

  const jobName = String(formData.get("job_name") ?? "").trim();
  const confirmation = String(formData.get("confirm_job_name") ?? "").trim();
  if (!jobName) {
    redirect("/jobs?status=error&message=Missing job name");
  }

  const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

  if (normalizeName(confirmation) !== normalizeName(jobName)) {
    redirect(
      `/jobs?status=error&message=${encodeURIComponent(
        "Delete blocked: confirmation must match the job name.",
      )}`,
    );
  }

  const { data: logs, error: fetchError } = await fetchInventoryLogsFromSupabase();
  if (fetchError) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(fetchError)}`);
  }

  const projectUsageLogs = logs.filter((log) => {
    const matchesJob = log.jobName?.trim().toLowerCase() === jobName.toLowerCase();
    const isUsageMovement = log.action === "out" && log.quantity < 0;
    return Boolean(matchesJob && isUsageMovement);
  });

  // Restore inventory by writing inverse "in" movements before deleting usage logs.
  for (const log of projectUsageLogs) {
    const restoreResult = await createInventoryLogInSupabase({
      materialId: log.materialId,
      action: "in",
      quantity: Math.abs(log.quantity),
      jobName,
      note: `Restored due to deleting project usage entries (${jobName})`,
    });

    if (restoreResult.error) {
      redirect(`/jobs?status=error&message=${encodeURIComponent(restoreResult.error)}`);
    }
  }

  for (const log of projectUsageLogs) {
    const deleteResult = await deleteInventoryLogInSupabase(log.id);
    if (deleteResult.error) {
      redirect(`/jobs?status=error&message=${encodeURIComponent(deleteResult.error)}`);
    }
  }

  const deleteWasteResult = await deleteWasteLogsByJobNameInSupabase(jobName);
  if (deleteWasteResult.error) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(deleteWasteResult.error)}`);
  }

  const deleteUsedMaterialResult = await deleteUsedMaterialLogsByJobNameInSupabase(jobName);
  if (deleteUsedMaterialResult.error) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(deleteUsedMaterialResult.error)}`);
  }

  const { data: buildings, error: buildingFetchError } = await fetchBuildingsFromSupabase();
  if (buildingFetchError) {
    redirect(`/jobs?status=error&message=${encodeURIComponent(buildingFetchError)}`);
  }

  const linkedBuilding = buildings.find(
    (building) => building.name.trim().toLowerCase() === jobName.toLowerCase(),
  );

  if (linkedBuilding) {
    const deleteBuildingResult = await deleteBuildingInSupabase(linkedBuilding.id);
    if (deleteBuildingResult.error) {
      redirect(`/jobs?status=error&message=${encodeURIComponent(deleteBuildingResult.error)}`);
    }
  }

  revalidatePath("/jobs");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/materials");
  revalidatePath("/buildings");
  redirect("/jobs?status=deleted-project");
}

type JobsPageProps = {
  searchParams?: {
    status?: string;
    message?: string;
    q?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = searchParams ?? {};
  const searchQuery = String(params.q ?? "").trim();
  const normalizedSearchQuery = searchQuery.toLowerCase();
  const [{ data: logs, error }, { data: materials }, { data: buildings }, { data: standards }] = await Promise.all([
    fetchInventoryLogsFromSupabase(),
    fetchMaterialsFromSupabase(),
    fetchBuildingsFromSupabase(),
    fetchJobSupplyStandardsFromSupabase(),
  ]);

  const materialById = materials.reduce<Record<string, { name: string }>>(
    (acc, material) => {
      acc[material.id] = { name: material.name };
      return acc;
    },
    {},
  );

  const validMaterialIds = new Set(materials.map((material) => material.id));
  const validStandards = standards.filter((entry) => validMaterialIds.has(entry.materialId));

  const jobSummaries = Object.values(
    logs.reduce<Record<string, JobSummary>>((acc, log) => {
      const jobName = log.jobName?.trim();

      if (!jobName) {
        return acc;
      }

      const usedQuantity = log.quantity < 0 ? Math.abs(log.quantity) : 0;
      if (usedQuantity === 0) {
        return acc;
      }

      if (!acc[jobName]) {
        acc[jobName] = {
          jobName,
          totalUsageEntries: 0,
          totalSuppliesUsed: 0,
          supplies: [],
          entries: [],
        };
      }

      acc[jobName].totalUsageEntries += 1;
      acc[jobName].totalSuppliesUsed += usedQuantity;

      const existingSupply = acc[jobName].supplies.find(
        (supply) => supply.materialId === log.materialId,
      );

      if (existingSupply) {
        existingSupply.quantityUsed += usedQuantity;
      } else {
        const material = materialById[log.materialId];
        acc[jobName].supplies.push({
          materialId: log.materialId,
          materialName: material?.name ?? "Unknown Material",
          quantityUsed: usedQuantity,
        });
      }

      acc[jobName].entries.push({
        id: log.id,
        materialId: log.materialId,
        materialName: materialById[log.materialId]?.name ?? "Unknown Material",
        quantityUsed: usedQuantity,
        createdAt: log.createdAt,
        ...(log.note ? { note: log.note } : {}),
      });

      return acc;
    }, {}),
  )
    .map((job) => ({
      ...job,
      supplies: [...job.supplies].sort((a, b) => b.quantityUsed - a.quantityUsed),
      entries: [...job.entries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12),
    }))
    .sort((a, b) => b.totalSuppliesUsed - a.totalSuppliesUsed);

  const filteredJobSummaries = jobSummaries.filter((job) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    const matchesJobName = job.jobName.toLowerCase().includes(normalizedSearchQuery);
    const matchesSupply = job.supplies.some((supply) =>
      supply.materialName.toLowerCase().includes(normalizedSearchQuery),
    );
    const matchesEntry = job.entries.some(
      (entry) =>
        entry.materialName.toLowerCase().includes(normalizedSearchQuery) ||
        (entry.note?.toLowerCase().includes(normalizedSearchQuery) ?? false),
    );

    return matchesJobName || matchesSupply || matchesEntry;
  });

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Jobs
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Track supplies used per job
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Store what materials were used on each build and how many were consumed.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-amber-200">
                Unable to load job activity from Supabase. {error}
              </p>
            ) : null}
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold hover:bg-[#111a2f]"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/job-types"
              className="inline-flex rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#111a2f]"
            >
              Open Job Types
            </Link>
            <Link
              href="/buildings"
              className="inline-flex rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#111a2f]"
            >
              Open Buildings
            </Link>
            <Link
              href="/jobs/standards"
              className="inline-flex rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#111a2f]"
            >
              Open Job Standards
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Log supplies used on a job</h2>
          <p className="mt-2 text-sm text-slate-300">
            Record multiple material and quantity sets in one submit.
          </p>

          {params.status === "success" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Job usage entry saved.
            </p>
          ) : null}

          {params.status === "deleted" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Job usage entry deleted.
            </p>
          ) : null}

          {params.status === "updated" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Job usage entry updated.
            </p>
          ) : null}

          {params.status === "deleted-project" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Finished project usage entries deleted and inventory restored.
            </p>
          ) : null}

          {params.status === "validation" ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Building ID is required. If needed, create a building on the Buildings page first.
              For each filled row, include both material and quantity greater than zero.
            </p>
          ) : null}

          {params.status === "error" ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Unable to save entry. {params.message ?? "Please try again."}
            </p>
          ) : null}

          <JobUsageForm
            action={logJobSupplyUsageAction}
            materials={materials.map((material) => ({
              id: material.id,
              name: material.name,
              sku: material.sku,
            }))}
            standards={validStandards.map((entry) => ({
              id: entry.id,
              jobType: entry.jobType,
              materialId: entry.materialId,
              quantity: entry.quantity,
              ...(entry.note ? { note: entry.note } : {}),
              createdAt: entry.createdAt,
            }))}
            buildings={buildings}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
          <h2 className="text-xl font-semibold">Job supply usage summary</h2>

          <form method="get" action="/jobs" className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Search jobs, supplies, or notes</span>
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by building/job name or material"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                Search
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/jobs"
                className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-[#111a2f]"
              >
                Clear
              </Link>
            </div>
          </form>

          <p className="mt-3 text-xs text-slate-400">
            Showing {filteredJobSummaries.length} of {jobSummaries.length} jobs.
          </p>

          {jobSummaries.length === 0 ? (
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
              <p className="text-base font-medium text-white">No usage entries yet.</p>
              <p className="mt-2 text-sm text-slate-300">
                Add a job usage entry above to track supplies consumed by job.
              </p>
            </div>
          ) : filteredJobSummaries.length === 0 ? (
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-[#050914] p-6">
              <p className="text-base font-medium text-white">No matching jobs found.</p>
              <p className="mt-2 text-sm text-slate-300">
                Try a different search term or clear the search.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {filteredJobSummaries.map((job) => (
                <div
                  key={job.jobName}
                  className="rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-4"
                >
                  <details>
                    <summary className="list-none hover:cursor-pointer">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-white">{job.jobName}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          <span>{job.totalUsageEntries} usage entries</span>
                          <span>{job.totalSuppliesUsed} total supplies used</span>
                          <span className="rounded-md border border-cyan-500/30 px-2 py-0.5 text-cyan-200">
                            Expand
                          </span>
                        </div>
                      </div>
                    </summary>

                    <div className="mt-4 space-y-4">
                      <form action={deleteJobUsageProjectAction} className="flex justify-end">
                        <input type="hidden" name="job_name" value={job.jobName} />
                        <details className="group w-fit">
                          <summary className="list-none inline-flex rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:cursor-pointer hover:bg-red-500/20">
                            Delete Project Entries
                          </summary>

                          <div className="mt-2 space-y-2">
                            <p className="text-xs font-semibold text-red-300">
                              Warning: this action cannot be undone.
                            </p>
                            <input
                              type="text"
                              name="confirm_job_name"
                              required
                              placeholder="Type job name to confirm"
                              className="w-full rounded-lg border border-cyan-400/30 bg-[#050914] px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="inline-flex rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/30"
                            >
                              Confirm Delete Project Entries
                            </button>
                          </div>
                        </details>
                      </form>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Usage entries
                          </p>
                          <p className="mt-1 text-lg font-bold text-white">{job.totalUsageEntries}</p>
                        </div>
                        <div className="rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Total supplies used
                          </p>
                          <p className="mt-1 text-lg font-bold text-white">{job.totalSuppliesUsed}</p>
                        </div>
                      </div>

                      <details>
                        <summary className="list-none text-xs uppercase tracking-wide text-slate-400 hover:cursor-pointer">
                          Supplies used by type
                        </summary>
                        <div className="mt-2 grid gap-2">
                          {job.supplies.map((supply) => (
                            <div
                              key={`${job.jobName}-${supply.materialId}`}
                              className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2 text-sm"
                            >
                              <p className="font-medium text-white">{supply.materialName}</p>
                              <p className="text-slate-300">{supply.quantityUsed} items</p>
                            </div>
                          ))}
                        </div>
                      </details>

                      <details>
                        <summary className="list-none text-xs uppercase tracking-wide text-slate-400 hover:cursor-pointer">
                          Usage entries (latest)
                        </summary>
                        <div className="mt-2 grid gap-2">
                          {job.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#111a2f]/80 px-3 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {entry.materialName} • {entry.quantityUsed} items
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {new Date(entry.createdAt).toLocaleString()}
                                  {entry.note ? ` • ${entry.note}` : ""}
                                </p>
                              </div>

                              <div className="flex items-start gap-2">
                                <details className="group w-fit">
                                  <summary className="list-none inline-flex rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:cursor-pointer hover:bg-cyan-500/20">
                                    Edit
                                  </summary>

                                  <form
                                    action={updateJobUsageEntryAction}
                                    className="mt-2 grid gap-2 rounded-lg border border-cyan-500/20 bg-[#050914] p-3 sm:min-w-[20rem]"
                                  >
                                    <input type="hidden" name="log_id" value={entry.id} />

                                    <label className="grid gap-1 text-xs">
                                      <span className="text-slate-300">Material</span>
                                      <select
                                        name="material_id"
                                        defaultValue={entry.materialId}
                                        className="rounded-lg border border-cyan-400/30 bg-[#050914] px-2 py-1 text-xs text-white focus:border-cyan-300 focus:outline-none"
                                      >
                                        {materials.map((material) => (
                                          <option key={`edit-${entry.id}-${material.id}`} value={material.id}>
                                            {material.name} ({material.sku})
                                          </option>
                                        ))}
                                      </select>
                                    </label>

                                    <label className="grid gap-1 text-xs">
                                      <span className="text-slate-300">Quantity Used</span>
                                      <input
                                        type="number"
                                        name="quantity"
                                        min={1}
                                        step={1}
                                        required
                                        defaultValue={entry.quantityUsed}
                                        className="rounded-lg border border-cyan-400/30 bg-[#050914] px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                                      />
                                    </label>

                                    <label className="grid gap-1 text-xs">
                                      <span className="text-slate-300">Note (optional)</span>
                                      <input
                                        type="text"
                                        name="note"
                                        defaultValue={entry.note ?? ""}
                                        placeholder="Optional"
                                        className="rounded-lg border border-cyan-400/30 bg-[#050914] px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                                      />
                                    </label>

                                    <button
                                      type="submit"
                                      className="inline-flex w-fit rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                                    >
                                      Save Update
                                    </button>
                                  </form>
                                </details>

                                <form action={deleteJobUsageEntryAction}>
                                  <input type="hidden" name="log_id" value={entry.id} />
                                  <button
                                    type="submit"
                                    className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        <JobStandardComparison
          materials={materials.map((material) => ({
            id: material.id,
            name: material.name,
            sku: material.sku,
          }))}
          standards={validStandards.map((entry) => ({
            id: entry.id,
            jobType: entry.jobType,
            materialId: entry.materialId,
            quantity: entry.quantity,
            ...(entry.note ? { note: entry.note } : {}),
            createdAt: entry.createdAt,
          }))}
          completedJobs={jobSummaries.map((job) => ({
            jobName: job.jobName,
            totalSuppliesUsed: job.totalSuppliesUsed,
            totalUsageEntries: job.totalUsageEntries,
            supplies: job.supplies,
          }))}
        />
      </section>
    </main>
  );
}
