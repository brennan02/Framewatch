"use server";

import { redirect } from "next/navigation";
import {
  createInventoryLogInSupabase,
  createWasteLogInSupabase,
} from "../lib/supabase";
import type { InventoryAction } from "../types/inventory";

const actionMap: Record<string, InventoryAction> = {
  Use: "out",
  Waste: "waste",
  Salvage: "salvaged",
  Received: "in",
};

export async function updateInventoryAction(formData: FormData) {
  const material_id = formData.get("material_id")?.toString();
  const actionLabel = formData.get("action")?.toString();
  const quantity = parseInt(formData.get("quantity")?.toString() || "0", 10);
  const job_name = formData.get("job_name")?.toString() || undefined;
  const note = formData.get("note")?.toString() || undefined;
  const defect_reason = formData.get("defect_reason")?.toString() || "other";

  if (!material_id || !actionLabel || !quantity || quantity <= 0) {
    redirect(`/inventory?status=error&message=Invalid form data`);
  }

  const action = actionMap[actionLabel] as InventoryAction;
  if (!action) {
    redirect(`/inventory?status=error&message=Invalid action`);
  }

  if (action === "waste") {
    const wasteResult = await createWasteLogInSupabase({
      materialId: material_id,
      quantity,
      defectReason: defect_reason as any,
      ...(job_name ? { jobName: job_name } : {}),
      ...(note ? { notes: note } : {}),
    });

    if (wasteResult.error) {
      redirect(`/inventory?status=error&message=${encodeURIComponent(wasteResult.error)}`);
    }

    // Also deduct from inventory so balance stays accurate
    const inventoryResult = await createInventoryLogInSupabase({
      materialId: material_id,
      action: "waste",
      quantity: -quantity,
      ...(job_name ? { jobName: job_name } : {}),
      ...(note ? { note } : {}),
    });

    if (inventoryResult.error) {
      redirect(`/inventory?status=error&message=${encodeURIComponent(inventoryResult.error)}`);
    }

    redirect("/inventory?status=success");
  }

  const signedQuantity = action === "in" ? quantity : -quantity;

  const result = await createInventoryLogInSupabase({
    materialId: material_id,
    action,
    quantity: signedQuantity,
    ...(job_name ? { jobName: job_name } : {}),
    ...(note ? { note } : {}),
  });

  if (result.error) {
    redirect(`/inventory?status=error&message=${encodeURIComponent(result.error)}`);
  }

  redirect("/inventory?status=success");
}
