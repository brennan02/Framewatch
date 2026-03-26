import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TopNavLinks } from "../src/components/top-nav-links";
import { MaterialAddForm } from "../src/components/material-add-form";
import {
  createMaterialInSupabase,
  deleteMaterialInSupabase,
  fetchMaterialsFromSupabase,
  type CreateMaterialInput,
} from "../src/lib/supabase";

const parseBooleanFromForm = (value: FormDataEntryValue | null) =>
  value === "on" || value === "true";

const requiredFields: Array<keyof Pick<CreateMaterialInput, "name" | "sku" | "category" | "unit">> = [
  "name",
  "sku",
  "category",
  "unit",
];

async function addMaterialAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const scanCode = String(formData.get("scan_code") ?? "").trim();
  const qrCode = String(formData.get("qr_code") ?? "").trim();
  const active = parseBooleanFromForm(formData.get("active"));

  const candidate: CreateMaterialInput = {
    name,
    sku,
    category,
    unit,
    active,
    ...(color ? { color } : {}),
    ...(scanCode ? { scanCode } : {}),
    ...(qrCode ? { qrCode } : {}),
  };

  const firstMissingField = requiredFields.find((field) => !candidate[field]);
  if (firstMissingField) {
    redirect(`/materials?status=validation&field=${encodeURIComponent(firstMissingField)}`);
  }

  const { error } = await createMaterialInSupabase(candidate);

  if (error) {
    redirect(`/materials?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/materials");
  redirect("/materials?status=success");
}

async function deleteMaterialAction(formData: FormData) {
  "use server";

  const materialId = String(formData.get("material_id") ?? "").trim();
  if (!materialId) {
    redirect("/materials?status=error&message=Missing material ID");
  }

  const { error } = await deleteMaterialInSupabase(materialId);

  if (error) {
    redirect(`/materials?status=error&message=${encodeURIComponent(error)}`);
  }

  revalidatePath("/materials");
  redirect("/materials?status=deleted");
}

type MaterialsPageProps = {
  searchParams?: {
    status?: string;
    field?: string;
    message?: string;
  };
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const params = searchParams ?? {};
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
          <h2 className="text-xl font-semibold">Add Material</h2>
          <p className="mt-2 text-sm text-slate-300">
            Add a new material record to the Tuckertown catalog. SKU will be auto-generated based on category.
          </p>

          <MaterialAddForm onSubmit={addMaterialAction} params={params} />
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-6">
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
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-[#050914] px-4 py-3 transition hover:border-cyan-400/60 hover:bg-[#111a2f]"
                  >
                    <Link
                      href={`/materials/${material.id}`}
                      className="flex-1 grid gap-2 sm:grid-cols-5"
                    >
                      <p className="font-medium text-white">{material.name}</p>
                      <p className="text-sm text-slate-300">{material.sku}</p>
                      <p className="text-sm capitalize text-slate-300">{material.category}</p>
                      <p className="text-sm text-slate-300">{material.unit}</p>
                      <p className="text-sm text-slate-300">{material.color ?? "—"}</p>
                    </Link>

                    <form action={deleteMaterialAction} className="flex-shrink-0">
                      <input type="hidden" name="material_id" value={material.id} />
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
