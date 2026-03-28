"use server";

import { redirect } from "next/navigation";
import { createUsedMaterialLogInSupabase } from "../lib/supabase";

export async function logUsedMaterialAction(formData: FormData) {
  const materialId = formData.get("materialId") as string;
  const quantity = formData.get("quantity") as string;
  const size = formData.get("size") as string;
  const unit = formData.get("unit") as string;
  const jobName = formData.get("jobName") as string;
  const notes = formData.get("notes") as string;

  // Validate inputs
  if (!materialId || !quantity || !size || !unit) {
    redirect("/used-materials?status=error&message=Missing required fields");
  }

  const quantityNum = parseInt(quantity, 10);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    redirect("/used-materials?status=error&message=Quantity must be a positive number");
  }

  // Create log in Supabase
  const { error } = await createUsedMaterialLogInSupabase({
    materialId,
    quantity: quantityNum,
    size,
    unit,
    jobName: jobName || undefined,
    notes: notes || undefined,
  });

  if (error) {
    redirect(`/used-materials?status=error&message=${encodeURIComponent(error)}`);
  }

  // Redirect to success
  redirect("/used-materials?status=success&message=Material logged successfully");
}
