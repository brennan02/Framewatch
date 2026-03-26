export type WasteDefectReason =
  | "warped"
  | "broken"
  | "defective"
  | "damaged"
  | "mismeasured"
  | "other";

export type WasteLog = {
  id: string;
  materialId: string;
  quantity: number;
  defectReason: WasteDefectReason;
  jobName?: string;
  notes?: string;
  createdAt: string;
};
