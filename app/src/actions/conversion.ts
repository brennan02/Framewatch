"use server";

import { redirect } from "next/navigation";
import { createUnitConversionInSupabase } from "../lib/supabase";

export async function createConversionAction(formData: FormData) {
  const sourceUnit = formData.get("sourceUnit") as string;
  const targetUnit = formData.get("targetUnit") as string;
  const conversionFactor = formData.get("conversionFactor") as string;
  const description = formData.get("description") as string;

  // Validate inputs
  if (!sourceUnit || !targetUnit || !conversionFactor) {
    redirect("/units/conversions?error=Missing required fields");
  }

  if (sourceUnit === targetUnit) {
    redirect("/units/conversions?error=Source and target units must be different");
  }

  const factor = parseFloat(conversionFactor);
  if (isNaN(factor) || factor <= 0) {
    redirect("/units/conversions?error=Conversion factor must be a positive number");
  }

  // Create conversion
  const { error } = await createUnitConversionInSupabase({
    sourceUnit,
    targetUnit,
    conversionFactor: factor,
    description: description || undefined,
  });

  if (error) {
    redirect(`/units/conversions?error=${encodeURIComponent(error)}`);
  }

  redirect("/units/conversions?status=success&message=Conversion created successfully");
}
