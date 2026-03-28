import type { UnitConversion } from "./supabase";

/**
 * Converts a value from one unit to another
 * @param value - The numeric value to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @param conversions - Array of available conversions
 * @returns The converted value, or null if no conversion path exists
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  conversions: UnitConversion[]
): number | null {
  // Same unit, no conversion needed
  if (fromUnit === toUnit) {
    return value;
  }

  // Build a map of conversions for quick lookup
  const conversionMap = new Map<string, UnitConversion[]>();
  conversions.forEach((conv) => {
    const key = `${conv.sourceUnit}→${conv.targetUnit}`;
    if (!conversionMap.has(key)) {
      conversionMap.set(key, []);
    }
    conversionMap.get(key)!.push(conv);

    // Also add reverse conversion (inverse factor)
    const reverseKey = `${conv.targetUnit}→${conv.sourceUnit}`;
    if (!conversionMap.has(reverseKey)) {
      conversionMap.set(reverseKey, []);
    }
    conversionMap.get(reverseKey)!.push({
      ...conv,
      sourceUnit: conv.targetUnit,
      targetUnit: conv.sourceUnit,
      conversionFactor: 1 / conv.conversionFactor,
    });
  });

  // Direct conversion
  const directKey = `${fromUnit}→${toUnit}`;
  const directConversions = conversionMap.get(directKey) || [];
  if (directConversions.length > 0) {
    return value * directConversions[0].conversionFactor;
  }

  // BFS to find conversion path (e.g., feet → inches → millimeters)
  const visited = new Set<string>();
  const queue: Array<{ unit: string; factor: number }> = [{ unit: fromUnit, factor: 1 }];

  while (queue.length > 0) {
    const { unit: currentUnit, factor: currentFactor } = queue.shift()!;

    if (currentUnit === toUnit) {
      return value * currentFactor;
    }

    if (visited.has(currentUnit)) continue;
    visited.add(currentUnit);

    // Find all conversions starting from current unit
    conversions.forEach((conv) => {
      if (conv.sourceUnit === currentUnit && !visited.has(conv.targetUnit)) {
        queue.push({
          unit: conv.targetUnit,
          factor: currentFactor * conv.conversionFactor,
        });
      }

      // Also check reverse conversions
      if (conv.targetUnit === currentUnit && !visited.has(conv.sourceUnit)) {
        queue.push({
          unit: conv.sourceUnit,
          factor: currentFactor / conv.conversionFactor,
        });
      }
    });
  }

  // No conversion path found
  return null;
}

/**
 * Checks if a conversion exists between two units
 */
export function canConvert(
  fromUnit: string,
  toUnit: string,
  conversions: UnitConversion[]
): boolean {
  if (fromUnit === toUnit) return true;
  return convertUnit(1, fromUnit, toUnit, conversions) !== null;
}
