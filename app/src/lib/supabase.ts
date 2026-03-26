import type { InventoryAction, InventoryLog } from "../types/inventory";
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

type SupabaseInventoryLogRow = {
  id: string;
  material_id?: string;
  materialId?: string;
  action: InventoryAction;
  quantity: number;
  job_name?: string | null;
  jobName?: string | null;
  note?: string | null;
  created_at?: string;
  createdAt?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const MATERIAL_FIELDS =
  "id,name,sku,category,unit,color,active,scan_code,qr_code,scanCode";

const INVENTORY_LOG_FIELDS =
  "id,material_id,materialId,action,quantity,job_name,jobName,note,created_at,createdAt";

export type CreateMaterialInput = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  color?: string;
  active: boolean;
  scanCode?: string;
  qrCode?: string;
};

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

const normalizeInventoryLog = (row: SupabaseInventoryLogRow): InventoryLog => ({
  id: row.id,
  materialId: row.material_id ?? row.materialId ?? "",
  action: row.action,
  quantity: Number(row.quantity) || 0,
  ...(row.job_name ?? row.jobName ? { jobName: row.job_name ?? row.jobName ?? undefined } : {}),
  ...(row.note ? { note: row.note } : {}),
  createdAt: row.created_at ?? row.createdAt ?? new Date(0).toISOString(),
});

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

async function supabaseGet<T>(path: string) {
  if (!isSupabaseConfigured()) {
    return { data: null as T | null, error: "Supabase env vars are not configured yet." };
  }

  const url = `${supabaseUrl}/rest/v1${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
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

async function supabasePost<TBody extends object>(path: string, body: TBody) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase env vars are not configured yet." };
  }

  const url = `${supabaseUrl}/rest/v1${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey as string,
      Authorization: `Bearer ${supabaseAnonKey as string}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: `Supabase insert failed with status ${response.status}.` };
  }

  return { error: null };
}

async function supabaseDelete(path: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase env vars are not configured yet." };
  }

  const url = `${supabaseUrl}/rest/v1${path}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey as string,
      Authorization: `Bearer ${supabaseAnonKey as string}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: `Supabase delete failed with status ${response.status}.` };
  }

  return { error: null };
}

export async function fetchMaterialsFromSupabase() {
  const result = await supabaseGet<SupabaseMaterialRow[]>(
    `/materials?order=name.asc`,
  );

  return {
    data: (result.data ?? []).map(normalizeMaterial),
    error: result.error,
  };
}

export async function fetchMaterialByIdFromSupabase(materialId: string) {
  const result = await supabaseGet<SupabaseMaterialRow[]>(
    `/materials?id=eq.${encodeURIComponent(materialId)}&limit=1`,
  );

  const material = result.data?.[0] ? normalizeMaterial(result.data[0]) : null;

  return {
    data: material,
    error: result.error,
  };
}

export async function fetchInventoryLogsFromSupabase() {
  const result = await supabaseGet<SupabaseInventoryLogRow[]>(
    `/inventory_logs?order=created_at.desc`,
  );

  return {
    data: (result.data ?? []).map(normalizeInventoryLog),
    error: result.error,
  };
}

export async function createMaterialInSupabase(material: CreateMaterialInput) {
  const payload: Record<string, string | boolean | null> = {
    id: crypto.randomUUID(),
    name: material.name,
    sku: material.sku,
    category: material.category,
    unit: material.unit,
    active: material.active,
    color: material.color ?? null,
  };

  if (material.scanCode) {
    payload.scan_code = material.scanCode;
  }

  if (material.qrCode) {
    payload.qr_code = material.qrCode;
  }

  return supabasePost("/materials", payload);
}

export async function deleteMaterialInSupabase(materialId: string) {
  return supabaseDelete(`/materials?id=eq.${encodeURIComponent(materialId)}`);
}

export async function deleteInventoryLogInSupabase(logId: string) {
  return supabaseDelete(`/inventory_logs?id=eq.${encodeURIComponent(logId)}`);
}
