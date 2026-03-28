"use server";

import {
  fetchMaterialsFromSupabase,
  fetchInventoryLogsFromSupabase,
  fetchWasteLogsFromSupabase,
  fetchUsedMaterialLogsFromSupabase,
  fetchUnitsFromSupabase,
  fetchCategoriesFromSupabase,
  fetchCategoriesWithUnitsFromSupabase,
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const fetchRawTable = async <T>(table: string, columns: string): Promise<T[]> => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return [];
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(columns)}`,
        {
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return [];
      }

      return (await response.json()) as T[];
    };

    const [
      materials,
      inventoryLogs,
      wasteLogs,
      usedMaterialLogs,
      units,
      categories,
      categoriesWithUnits,
      jobTypes,
      buildings,
      conversions,
      unitsRaw,
    ] = await Promise.all([
      fetchMaterialsFromSupabase(),
      fetchInventoryLogsFromSupabase(),
      fetchWasteLogsFromSupabase(),
      fetchUsedMaterialLogsFromSupabase(),
      fetchUnitsFromSupabase(),
      fetchCategoriesFromSupabase(),
      fetchCategoriesWithUnitsFromSupabase(),
      fetchJobTypesFromSupabase(),
      fetchBuildingsFromSupabase(),
      fetchUnitConversionsFromSupabase(),
      fetchRawTable<{ id: string; name: string; description?: string | null }>(
        "units",
        "id,name,description",
      ),
    ]);

    return {
      materials: materials.data || [],
      inventory_logs: inventoryLogs.data || [],
      waste_logs: wasteLogs.data || [],
      used_materials_logs: usedMaterialLogs.data || [],
      units:
        unitsRaw.length > 0
          ? unitsRaw.map((u) => ({ name: u.name, description: u.description ?? null }))
          : units.data
            ? units.data.map((u) => ({ name: u }))
            : [],
      categories:
        categoriesWithUnits.data && categoriesWithUnits.data.length > 0
          ? categoriesWithUnits.data
          : categories.data || [],
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

    // Helper: map exported camelCase fields to actual DB snake_case columns
    const mapUnits = (records: any[]): any[] =>
      records.map(r => {
        const name = typeof r === "string" ? r : r.name;
        const description = typeof r === "object" ? (r.description ?? null) : null;
        const id = typeof r === "object" && typeof r.id === "string" && r.id
          ? r.id
          : crypto.randomUUID();
        return { id, name, description };
      });

    const mapBuildings = (records: any[]): any[] =>
      records.map(r => ({
        id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
        name: r.name,
        special_id: r.special_id || r.specialId || null,
        qr_value: r.qr_value || r.qrValue || null,
        job_type_name: r.job_type_name || r.jobTypeName || null,
      }));

    const mapCategories = (records: any[]): any[] =>
      records.map(r => {
        const name = typeof r === "string" ? r : r.name;
        const id = typeof r === "object" && typeof r.id === "string" && r.id
          ? r.id
          : crypto.randomUUID();
        return {
          id,
          name,
          unit_name: (typeof r === "object" && r.unit_name) ? r.unit_name : null,
          description: (typeof r === "object" && r.description) ? r.description : null,
        };
      });

    const mapMaterials = (records: any[]): any[] =>
      records.map(r => ({
        id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
        name: r.name,
        sku: r.sku,
        category: r.category,
        unit: r.unit,
        active: r.active ?? true,
        color: r.color || null,
        scan_code: r.scan_code || r.scanCode || null,
        qr_code: r.qr_code || r.qrCode || null,
      }));

    const mapConversions = (records: any[]): any[] =>
      records.map(r => ({
        source_unit: r.source_unit || r.sourceUnit,
        target_unit: r.target_unit || r.targetUnit,
        conversion_factor: r.conversion_factor || r.conversionFactor,
        description: r.description || null,
      }));

    const mapInventoryLogs = (records: any[]): any[] =>
      records.map(r => ({
        id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
        material_id: r.material_id || r.materialId,
        action: r.action,
        quantity: r.quantity,
        job_name: r.job_name || r.jobName || null,
        note: r.note || null,
      }));

    const mapWasteLogs = (records: any[]): any[] =>
      records.map(r => ({
        id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
        material_id: r.material_id || r.materialId,
        quantity: r.quantity,
        reason: r.reason || null,
        note: r.note || null,
        job_name: r.job_name || r.jobName || null,
      }));

    const mapUsedMaterialLogs = (records: any[]): any[] =>
      records.map(r => ({
        id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
        material_id: r.material_id || r.materialId,
        quantity: r.quantity,
        size: r.size,
        unit: r.unit,
        job_name: r.job_name || r.jobName || null,
      }));

    const importOrder = [
      { table: "units", records: mapUnits(data.units || []) },
      { table: "buildings", records: mapBuildings(data.buildings || []) },
      { table: "categories", records: mapCategories(data.categories || []) },
      { table: "job_types", records: (data.job_types || []).map((r: any) => ({ name: r.name, description: r.description || null })) },
      { table: "materials", records: mapMaterials(data.materials || []) },
      { table: "unit_conversions", records: mapConversions(data.unit_conversions || []) },
      { table: "inventory_logs", records: mapInventoryLogs(data.inventory_logs || []) },
      { table: "waste_logs", records: mapWasteLogs(data.waste_logs || []) },
      { table: "used_materials_logs", records: mapUsedMaterialLogs(data.used_materials_logs || []) },
    ];

    console.log("Import started with data:", {
      units: data.units?.length || 0,
      buildings: data.buildings?.length || 0,
      materials: data.materials?.length || 0,
      inventory_logs: data.inventory_logs?.length || 0,
    });

    const failedTables: string[] = [];
    let importedCount = 0;

    // Insert sequentially to respect foreign key constraints
    for (const { table, records } of importOrder) {
      if (records.length === 0) {
        console.log(`Skipping ${table}: no records`);
        continue;
      }

      console.log(`Attempting to insert ${records.length} records into ${table}`);

      try {
        const url = `${supabaseUrl}/rest/v1/${table}`;
        console.log(`Making POST request to: ${url}`);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(records),
        });

        if (!response.ok) {
          const errorText = await response.text();
          failedTables.push(`${table} (${response.status})`);
          console.error(`Failed to import ${table}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            firstRecord: records[0],
          });
        } else {
          importedCount++;
          console.log(`Successfully imported ${table}: ${records.length} records`);
        }
      } catch (error) {
        failedTables.push(table);
        console.error(`Error importing ${table}:`, error);
      }
    }

    if (failedTables.length > 0) {
      return {
        success: false,
        message: `Import partially failed. ${importedCount} tables succeeded, ${failedTables.length} failed: ${failedTables.join(", ")}`,
      };
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} tables with all records`,
    };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: "Import failed: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}
