export type MaterialUnit =
  | "piece"
  | "bundle"
  | "sheet"
  | "roll"
  | "box"
  | "foot";

export type MaterialCategory =
  | "lumber"
  | "siding"
  | "metal"
  | "wiring"
  | "fasteners"
  | "other";

export type Material = {
  id: string;
  name: string;
  sku: string;
  scanCode: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  color?: string;
  active: boolean;
};
