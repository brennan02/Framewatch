"use server";

import {
  fetchMaterialsFromSupabase,
  fetchInventoryLogsFromSupabase,
  fetchWasteLogsFromSupabase,
  fetchUsedMaterialLogsFromSupabase,
  fetchUnitsFromSupabase,
  fetchCategoriesFromSupabase,
  fetchJobTypesFromSupabase,
  fetchBuildingsFromSupabase,
  fetchUnitConversionsFromSupabase,
} from "../lib/supabase";

type ExportData = {
  materials: any[];
  inventory_logs: any[];
  waste_logs: any[];
  used_materials_logs: any[];
  units: any[];
  categories: any[];
  job_types: any[];
  buildings: any[];
  unit_conversions: any[];
};

export async function exportAllDataAsJSON(): Promise<ExportData | null> {
  try {
    const [
      materials,
      inventoryLogs,
      wasteLogs,
      usedMaterialLogs,
      units,
      categories,
      jobTypes,
      buildings,
      conversions,
    ] = await Promise.all([
      fetchMaterialsFromSupabase(),
      fetchInventoryLogsFromSupabase(),
      fetchWasteLogsFromSupabase(),
      fetchUsedMaterialLogsFromSupabase(),
      fetchUnitsFromSupabase(),
      fetchCategoriesFromSupabase(),
      fetchJobTypesFromSupabase(),
      fetchBuildingsFromSupabase(),
      fetchUnitConversionsFromSupabase(),
    ]);

    return {
      materials: materials.data || [],
      inventory_logs: inventoryLogs.data || [],
      waste_logs: wasteLogs.data || [],
      used_materials_logs: usedMaterialLogs.data || [],
      units: units.data ? units.data.map((u) => ({ name: u })) : [],
      categories: categories.data || [],
      job_types: jobTypes.data || [],
      buildings: buildings.data || [],
      unit_conversions: conversions.data || [],
    };
  } catch (error) {
    console.error("Export failed:", error);
    return null;
  }
}
