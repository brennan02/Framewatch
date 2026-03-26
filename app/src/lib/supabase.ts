import type { Material, MaterialCategory, MaterialUnit } from "../types/material";

type SupabaseMaterialRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  color: string | null;
  active: boolean;
  scan_code?: string | null;
  qr_code?: string | null;
  scanCode?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MATERIAL_FIELDS =
  "id,name,sku,category,unit,color,active,scan_code,qr_code,scanCode";

const normalizeMaterial = (row: SupabaseMaterialRow): Material => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  category: row.category as MaterialCategory,
  unit: row.unit as MaterialUnit,
  color: row.color ?? undefined,
  active: Boolean(row.active),
  scanCode: row.scan_code ?? row.qr_code ?? row.scanCode ?? row.id,
});

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

async function supabaseGet<T>(path: string) {
  if (!isSupabaseConfigured()) {
    return { data: null as T | null, error: "Supabase env vars are not configured yet." };
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: supabaseAnonKey as string,
      Authorization: `Bearer ${supabaseAnonKey as string}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      data: null as T | null,
      error: `Supabase request failed with status ${response.status}.`,
    };
  }

  return { data: (await response.json()) as T, error: null };
}

export async function fetchMaterialsFromSupabase() {
  const result = await supabaseGet<SupabaseMaterialRow[]>(
    `/rest/v1/materials?select=${MATERIAL_FIELDS}&order=name.asc`,
  );

  return {
    data: (result.data ?? []).map(normalizeMaterial),
    error: result.error,
  };
}

export async function fetchMaterialByIdFromSupabase(materialId: string) {
  const result = await supabaseGet<SupabaseMaterialRow[]>(
    `/rest/v1/materials?select=${MATERIAL_FIELDS}&id=eq.${encodeURIComponent(materialId)}&limit=1`,
  );

  const material = result.data?.[0] ? normalizeMaterial(result.data[0]) : null;

  return {
    data: material,
    error: result.error,
  };
}
