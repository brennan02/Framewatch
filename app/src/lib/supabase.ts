import type { InventoryAction, InventoryLog } from "../types/inventory";
import type { Material, MaterialCategory, MaterialUnit } from "../types/material";
import type { WasteLog, WasteDefectReason } from "../types/waste";

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

async function supabasePatch<TBody extends object>(path: string, body: TBody) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase env vars are not configured yet." };
  }

  const url = `${supabaseUrl}/rest/v1${path}`;
  const response = await fetch(url, {
    method: "PATCH",
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
    return { error: `Supabase update failed with status ${response.status}.` };
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

export async function deleteInventoryLogsByJobNameInSupabase(jobName: string) {
  return supabaseDelete(`/inventory_logs?job_name=eq.${encodeURIComponent(jobName)}`);
}

export async function updateMaterialInSupabase(
  materialId: string,
  updates: Partial<CreateMaterialInput>
) {
  const payload: Record<string, string | boolean | null> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.active !== undefined) payload.active = updates.active;
  if (updates.color !== undefined) payload.color = updates.color ?? null;
  if (updates.scanCode !== undefined) payload.scan_code = updates.scanCode ?? null;
  if (updates.qrCode !== undefined) payload.qr_code = updates.qrCode ?? null;

  return supabasePatch(`/materials?id=eq.${encodeURIComponent(materialId)}`, payload);
}

export async function updateInventoryLogInSupabase(
  logId: string,
  updates: Partial<SupabaseInventoryLogRow>
) {
  const payload: Record<string, unknown> = {};

  if (updates.action !== undefined) payload.action = updates.action;
  if (updates.quantity !== undefined) payload.quantity = updates.quantity;
  if (updates.job_name !== undefined) payload.job_name = updates.job_name ?? null;
  if (updates.jobName !== undefined) payload.jobName = updates.jobName ?? null;
  if (updates.note !== undefined) payload.note = updates.note ?? null;

  return supabasePatch(`/inventory_logs?id=eq.${encodeURIComponent(logId)}`, payload);
}

export type CreateInventoryLogInput = {
  materialId: string;
  action: InventoryAction;
  quantity: number;
  jobName?: string;
  note?: string;
};

export async function createInventoryLogInSupabase(log: CreateInventoryLogInput) {
  const payload: Record<string, string | number | null> = {
    id: crypto.randomUUID(),
    material_id: log.materialId,
    action: log.action,
    quantity: log.quantity,
    created_at: new Date().toISOString(),
  };

  if (log.jobName) {
    payload.job_name = log.jobName;
  }

  if (log.note) {
    payload.note = log.note;
  }

  return supabasePost("/inventory_logs", payload);
}

type SupabaseCategoryRow = {
  id: string;
  name: string;
  description?: string | null;
  unit_name?: string | null;
  created_at?: string;
};

export async function fetchCategoriesFromSupabase() {
  const result = await supabaseGet<SupabaseCategoryRow[]>(
    `/categories?order=name.asc`,
  );

  return {
    data: (result.data ?? []).map((cat) => cat.name),
    error: result.error,
  };
}

export async function fetchCategoriesWithUnitsFromSupabase() {
  const result = await supabaseGet<SupabaseCategoryRow[]>(
    `/categories?order=name.asc`,
  );

  return {
    data: (result.data ?? []).map((cat) => ({
      name: cat.name,
      description: cat.description,
      unit_name: cat.unit_name,
    })),
    error: result.error,
  };
}

export async function createCategoryInSupabase(name: string, unitName?: string, description?: string) {
  const payload: Record<string, string | null> = {
    id: crypto.randomUUID(),
    name: name.trim(),
    unit_name: unitName?.trim() ?? null,
    description: description?.trim() ?? null,
  };

  return supabasePost("/categories", payload);
}

export async function updateCategoryUnitInSupabase(categoryName: string, unitName: string | null) {
  const updates: Record<string, string | null> = {
    unit_name: unitName?.trim() ?? null,
  };

  return supabasePatch(
    `/categories?name=eq.${encodeURIComponent(categoryName)}`,
    updates,
  );
}

export async function deleteCategoryInSupabase(categoryName: string) {
  return supabaseDelete(`/categories?name=eq.${encodeURIComponent(categoryName)}`);
}

type SupabaseUnitRow = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

type SupabaseJobTypeRow = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

type SupabaseBuildingRow = {
  id: string;
  name: string;
  job_type_name?: string | null;
  special_id: string;
  qr_value: string;
  created_at?: string;
};

export async function fetchUnitsFromSupabase() {
  const result = await supabaseGet<SupabaseUnitRow[]>(
    `/units?order=name.asc`,
  );

  return {
    data: (result.data ?? []).map((unit) => unit.name),
    error: result.error,
  };
}

export async function createUnitInSupabase(name: string, description?: string) {
  const payload: Record<string, string | null> = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim() ?? null,
  };

  return supabasePost("/units", payload);
}

export async function deleteUnitInSupabase(unitName: string) {
  return supabaseDelete(`/units?name=eq.${encodeURIComponent(unitName)}`);
}

export async function fetchJobTypesFromSupabase() {
  const result = await supabaseGet<SupabaseJobTypeRow[]>(
    `/job_types?order=name.asc`,
  );

  return {
    data: (result.data ?? []).map((jobType) => ({
      name: jobType.name,
      description: jobType.description,
    })),
    error: result.error,
  };
}

export async function createJobTypeInSupabase(name: string, description?: string) {
  const payload: Record<string, string | null> = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim() ?? null,
  };

  return supabasePost("/job_types", payload);
}

export async function deleteJobTypeInSupabase(name: string) {
  return supabaseDelete(`/job_types?name=eq.${encodeURIComponent(name)}`);
}

export type CreateBuildingInput = {
  name: string;
  specialId: string;
  qrValue: string;
  jobTypeName?: string;
};

export async function fetchBuildingsFromSupabase() {
  const result = await supabaseGet<SupabaseBuildingRow[]>(
    `/buildings?order=created_at.desc`,
  );

  return {
    data: (result.data ?? []).map((building) => ({
      id: building.id,
      name: building.name,
      specialId: building.special_id,
      qrValue: building.qr_value,
      ...(building.job_type_name ? { jobTypeName: building.job_type_name } : {}),
    })),
    error: result.error,
  };
}

export async function createBuildingInSupabase(input: CreateBuildingInput) {
  const payload: Record<string, string | null> = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    special_id: input.specialId.trim(),
    qr_value: input.qrValue.trim(),
    job_type_name: input.jobTypeName?.trim() || null,
  };

  return supabasePost("/buildings", payload);
}

export async function deleteBuildingInSupabase(buildingId: string) {
  return supabaseDelete(`/buildings?id=eq.${encodeURIComponent(buildingId)}`);
}

// Waste Management Functions

type SupabaseWasteLogRow = {
  id: string;
  material_id?: string;
  materialId?: string;
  quantity: number;
  defect_reason?: string;
  defectReason?: string;
  job_name?: string | null;
  jobName?: string | null;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
};

const normalizeWasteLog = (row: SupabaseWasteLogRow): WasteLog => ({
  id: row.id,
  materialId: row.material_id ?? row.materialId ?? "",
  quantity: Number(row.quantity) || 0,
  defectReason: (row.defect_reason ?? row.defectReason ?? "other") as WasteDefectReason,
  ...(row.job_name ?? row.jobName ? { jobName: row.job_name ?? row.jobName ?? undefined } : {}),
  ...(row.notes ? { notes: row.notes } : {}),
  createdAt: row.created_at ?? row.createdAt ?? new Date(0).toISOString(),
});

export type CreateWasteLogInput = {
  materialId: string;
  quantity: number;
  defectReason: WasteDefectReason;
  jobName?: string;
  notes?: string;
};

export async function fetchWasteLogsFromSupabase() {
  const result = await supabaseGet<SupabaseWasteLogRow[]>(
    `/waste_logs?order=created_at.desc`,
  );

  return {
    data: (result.data ?? []).map(normalizeWasteLog),
    error: result.error,
  };
}

export async function fetchWasteLogByIdFromSupabase(wasteLogId: string) {
  const result = await supabaseGet<SupabaseWasteLogRow[]>(
    `/waste_logs?id=eq.${encodeURIComponent(wasteLogId)}&limit=1`,
  );

  const log = result.data?.[0] ? normalizeWasteLog(result.data[0]) : null;
  return { data: log, error: result.error };
}

export async function createWasteLogInSupabase(log: CreateWasteLogInput) {
  const payload: Record<string, string | number | null> = {
    id: crypto.randomUUID(),
    material_id: log.materialId,
    quantity: log.quantity,
    defect_reason: log.defectReason,
    created_at: new Date().toISOString(),
  };

  if (log.jobName) {
    payload.job_name = log.jobName;
  }

  if (log.notes) {
    payload.notes = log.notes;
  }

  return supabasePost("/waste_logs", payload);
}

export async function deleteWasteLogInSupabase(wasteLogId: string) {
  return supabaseDelete(`/waste_logs?id=eq.${encodeURIComponent(wasteLogId)}`);
}

// Used Materials Functions

import type { UsedMaterialLog } from "../types/used-material";

type SupabaseUsedMaterialLogRow = {
  id: string;
  material_id?: string;
  materialId?: string;
  quantity: number;
  size: string;
  unit: string;
  job_name?: string | null;
  jobName?: string | null;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
};

const normalizeUsedMaterialLog = (row: SupabaseUsedMaterialLogRow): UsedMaterialLog => ({
  id: row.id,
  materialId: row.material_id ?? row.materialId ?? "",
  quantity: Number(row.quantity) || 0,
  size: row.size,
  unit: row.unit,
  ...(row.job_name ?? row.jobName ? { jobName: row.job_name ?? row.jobName ?? undefined } : {}),
  ...(row.notes ? { notes: row.notes } : {}),
  createdAt: row.created_at ?? row.createdAt ?? new Date(0).toISOString(),
});

export type CreateUsedMaterialLogInput = {
  materialId: string;
  quantity: number;
  size: string;
  unit: string;
  jobName?: string;
  notes?: string;
};

export async function fetchUsedMaterialLogsFromSupabase() {
  const result = await supabaseGet<SupabaseUsedMaterialLogRow[]>(
    `/used_materials_logs?order=created_at.desc`,
  );

  return {
    data: (result.data ?? []).map(normalizeUsedMaterialLog),
    error: result.error,
  };
}

export async function createUsedMaterialLogInSupabase(log: CreateUsedMaterialLogInput) {
  const payload: Record<string, string | number | null> = {
    id: crypto.randomUUID(),
    material_id: log.materialId,
    quantity: log.quantity,
    size: log.size,
    unit: log.unit,
    created_at: new Date().toISOString(),
  };

  if (log.jobName) {
    payload.job_name = log.jobName;
  }

  if (log.notes) {
    payload.notes = log.notes;
  }

  return supabasePost("/used_materials_logs", payload);
}

export async function deleteUsedMaterialLogInSupabase(logId: string) {
  return supabaseDelete(`/used_materials_logs?id=eq.${encodeURIComponent(logId)}`);
}
