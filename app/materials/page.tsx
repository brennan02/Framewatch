import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TopNavLinks } from "../src/components/top-nav-links";
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

  const validationFieldName =
    params.status === "validation" && params.field ? params.field.toUpperCase() : null;

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
            Add a new material record to the Tuckertown catalog.
          </p>

          {params.status === "success" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Material added successfully.
            </p>
          ) : null}

          {params.status === "deleted" ? (
            <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Material deleted successfully.
            </p>
          ) : null}

          {validationFieldName ? (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Missing required field: {validationFieldName}.
            </p>
          ) : null}

          {params.status === "error" ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Unable to add material right now. {params.message ?? "Please try again."}
            </p>
          ) : null}

          <form action={addMaterialAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Name *</span>
              <input
                name="name"
                type="text"
                required
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">SKU *</span>
              <input
                name="sku"
                type="text"
                required
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Category *</span>
              <input
                name="category"
                type="text"
                required
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Unit *</span>
              <input
                name="unit"
                type="text"
                required
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Color (optional)</span>
              <input
                name="color"
                type="text"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Scan Code (optional)</span>
              <input
                name="scan_code"
                type="text"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">QR Code (optional)</span>
              <input
                name="qr_code"
                type="text"
                className="rounded-xl border border-cyan-400/30 bg-[#050914] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                name="active"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border border-cyan-300/40 bg-[#050914] text-cyan-300"
              />
              Active
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                Add Material
              </button>
            </div>
          </form>
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
