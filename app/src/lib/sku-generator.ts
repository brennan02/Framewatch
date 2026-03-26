/**
 * Generate a SKU based on category
 * Format: CAT-YYYYMMDDHHMM
 * Example: STR-202603251045 for Steel on March 25, 2026 at 10:45
 */
export function generateSKU(category: string): string {
  if (!category || category.trim().length === 0) {
    return "";
  }

  // Get category abbreviation (first 3 letters, uppercase)
  const catAbbr = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");

  // Get current timestamp in YYYYMMDDHHMM format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const timestamp = `${year}${month}${day}${hours}${minutes}`;

  return `${catAbbr}-${timestamp}`;
}
