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
  deleteAllDataFromTable,
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

export async function resetAllData(): Promise<{ success: boolean; message: string }> {
  try {
    // Delete in dependency order to respect foreign key constraints
    // Tables that reference others must be deleted first
    const deleteOrder = [
      "used_materials_logs",    // references materials, units
      "waste_logs",             // references materials
      "unit_conversions",       // references units
      "categories",             // references units
      "materials",              // now safe, logs are gone
      "units",                  // now safe, conversions/categories are gone
      "inventory_logs",         // no dependencies
      "job_types",              // no dependencies
      "buildings",              // no dependencies
    ];

    const failedTables: string[] = [];

    // Delete sequentially to respect foreign key constraints
    for (const table of deleteOrder) {
      const result = await deleteAllDataFromTable(table);
      if (result.error) {
        failedTables.push(table);
        console.error(`Failed to delete from ${table}:`, result.error);
      }
    }

    if (failedTables.length > 0) {
      return {
        success: false,
        message: `Failed to delete from: ${failedTables.join(", ")}. Check Supabase RLS policies.`,
      };
    }

    return { success: true, message: "All data has been successfully reset" };
  } catch (error) {
    console.error("Reset failed:", error);
    return { success: false, message: "Reset failed: " + (error instanceof Error ? error.message : "Unknown error") };
  }
}

export async function importDataFromJSON(data: ExportData): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, message: "Supabase configuration missing" };
    }

    const insertPromises = [];

    // Insert data in reverse order of deletion (parent tables first)
    if (data.units && data.units.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/units`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.units),
        })
      );
    }

    if (data.buildings && data.buildings.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/buildings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.buildings),
        })
      );
    }

    if (data.categories && data.categories.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.categories),
        })
      );
    }

    if (data.job_types && data.job_types.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/job_types`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.job_types),
        })
      );
    }

    if (data.materials && data.materials.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/materials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.materials),
        })
      );
    }

    if (data.unit_conversions && data.unit_conversions.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/unit_conversions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.unit_conversions),
        })
      );
    }

    if (data.inventory_logs && data.inventory_logs.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/inventory_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.inventory_logs),
        })
      );
    }

    if (data.waste_logs && data.waste_logs.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/waste_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.waste_logs),
        })
      );
    }

    if (data.used_materials_logs && data.used_materials_logs.length > 0) {
      insertPromises.push(
        fetch(`${supabaseUrl}/rest/v1/used_materials_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(data.used_materials_logs),
        })
      );
    }

    const results = await Promise.all(insertPromises);
    const failedInserts = results.filter((r) => !r.ok);

    if (failedInserts.length > 0) {
      return {
        success: false,
        message: `Import failed: ${failedInserts.length} tables failed to import`,
      };
    }

    return {
      success: true,
      message: `Successfully imported ${insertPromises.length} tables with all records`,
    };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: "Import failed: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}
