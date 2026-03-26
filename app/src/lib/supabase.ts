import type { Material } from "../types/material";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  // TODO(framewatch-mvp): Gradually replace mock data reads with Supabase queries page-by-page.
  const result = await supabaseGet<Material[]>("/rest/v1/materials?select=*");

  return {
    data: result.data ?? [],
    error: result.error,
  };
}
