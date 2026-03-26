import type { InventoryLog } from "../types/inventory";
import type { Material } from "../types/material";

export const materials: Material[] = [
  {
    id: "mat-2x4-8",
    name: '2x4 x 8',
    sku: "LUM-2X4-8",
    scanCode: "FW-LUM-2408",
    category: "lumber",
    unit: "piece",
    active: true,
  },
  {
    id: "mat-2x6-8",
    name: '2x6 x 8',
    sku: "LUM-2X6-8",
    scanCode: "FW-LUM-2608",
    category: "lumber",
    unit: "piece",
    active: true,
  },
  {
    id: "mat-red-siding",
    name: "Wood Siding",
    sku: "SID-WOOD-RED",
    scanCode: "FW-SID-WRED",
    category: "siding",
    unit: "piece",
    color: "red",
    active: true,
  },
  {
    id: "mat-blue-metal",
    name: "Metal Siding",
    sku: "MET-BLUE-PNL",
    scanCode: "FW-MET-BLUE",
    category: "metal",
    unit: "piece",
    color: "blue",
    active: true,
  },
  {
    id: "mat-wire-basic",
    name: "Standard Wiring",
    sku: "WIRE-STD",
    scanCode: "FW-WIR-STD1",
    category: "wiring",
    unit: "roll",
    active: true,
  },
];

export const inventoryLogs: InventoryLog[] = [
  {
    id: "log-1",
    materialId: "mat-2x4-8",
    action: "in",
    quantity: 50,
    jobName: "Stock Yard",
    createdAt: "2026-03-25T09:00:00.000Z",
  },
  {
    id: "log-2",
    materialId: "mat-2x4-8",
    action: "out",
    quantity: 12,
    jobName: "Cabin A12",
    createdAt: "2026-03-25T11:30:00.000Z",
  },
  {
    id: "log-3",
    materialId: "mat-2x6-8",
    action: "waste",
    quantity: 2,
    jobName: "Cabin A12",
    note: "Warped boards",
    createdAt: "2026-03-25T12:15:00.000Z",
  },
];
