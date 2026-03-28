"use client";

import { deleteUnitConversionInSupabase } from "../lib/supabase";
import type { UnitConversion } from "../lib/supabase";

export function ConversionsList({ conversions }: { conversions: UnitConversion[] }) {
  const handleDelete = async (conversionId: string) => {
    if (!confirm("Delete this conversion?")) return;
    
    const { error } = await deleteUnitConversionInSupabase(conversionId);
    
    if (!error) {
      // Reload page to show updated list
      window.location.reload();
    } else {
      alert(`Failed to delete: ${error}`);
    }
  };

  if (conversions.length === 0) {
    return (
      <div className="rounded-lg border border-cyan-400/10 bg-[#0c1426]/40 p-6 text-center">
        <p className="text-slate-400">No conversions configured yet.</p>
        <p className="mt-2 text-xs text-slate-500">Add one using the form to the left.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversions.map((conv) => (
        <div
          key={conv.id}
          className="rounded-lg border border-cyan-400/20 bg-[#0a1120] p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{conv.sourceUnit}</span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-white">{conv.targetUnit}</span>
              </div>
              <p className="mt-1 text-sm text-cyan-300">
                1 {conv.sourceUnit} = {conv.conversionFactor} {conv.targetUnit}
              </p>
              {conv.description && (
                <p className="mt-1 text-xs text-slate-400">{conv.description}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(conv.id)}
              className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300 hover:bg-red-500/20 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
