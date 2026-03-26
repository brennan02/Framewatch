"use server";

import { redirect } from "next/navigation";
import {
  createWasteLogInSupabase,
  deleteWasteLogInSupabase,
  fetchWasteLogByIdFromSupabase,
  createInventoryLogInSupabase,
} from "../lib/supabase";

export async function logWasteAction(formData: FormData) {
  const material_id = formData.get("material_id")?.toString();
  const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
  const defect_reason = formData.get("defect_reason")?.toString();
  const job_name = formData.get("job_name")?.toString() || undefined;
  const notes = formData.get("notes")?.toString() || undefined;

  if (!material_id || !quantity || !defect_reason || quantity <= 0) {
    redirect(`/waste?status=error&message=Invalid form data`);
  }

  const result = await createWasteLogInSupabase({
    materialId: material_id,
    quantity,
    defectReason: defect_reason as any,
    ...(job_name ? { jobName: job_name } : {}),
    ...(notes ? { notes } : {}),
  });

  if (result.error) {
    redirect(`/waste?status=error&message=${encodeURIComponent(result.error)}`);
  }

  // Also deduct from inventory so balance stays accurate
  const inventoryResult = await createInventoryLogInSupabase({
    materialId: material_id,
    action: "waste",
    quantity: -quantity,
    ...(job_name ? { jobName: job_name } : {}),
  });

  if (inventoryResult.error) {
    redirect(`/waste?status=error&message=${encodeURIComponent(inventoryResult.error)}`);
  }

  redirect("/waste?status=success");
}

export async function deleteWasteAction(formData: FormData) {
  const wasteLogId = formData.get("waste_log_id")?.toString();
  if (!wasteLogId) {
    redirect(`/waste?status=error&message=Missing waste log ID`);
  }

  // Fetch the log first so we know the quantity and material to restore
  const { data: wasteLog, error: fetchError } = await fetchWasteLogByIdFromSupabase(wasteLogId);
  if (fetchError || !wasteLog) {
    redirect(`/waste?status=error&message=${encodeURIComponent("Could not find waste log to delete")}`);
  }

  const deleteResult = await deleteWasteLogInSupabase(wasteLogId);
  if (deleteResult.error) {
    redirect(`/waste?status=error&message=${encodeURIComponent("Failed to delete waste log")}`);
  }

  // Restore the inventory by adding back the quantity
  await createInventoryLogInSupabase({
    materialId: wasteLog.materialId,
    action: "in",
    quantity: wasteLog.quantity,
    note: "Restored: waste log deleted",
  });

  redirect("/waste?status=success&message=Waste%20log%20deleted%20and%20inventory%20restored");
}
