import { fetchUnitsFromSupabase, fetchUnitConversionsFromSupabase } from "../../src/lib/supabase";
import { ConversionForm } from "../../src/components/conversion-form";
import { ConversionsList } from "../../src/components/conversions-list";

export default async function ConversionsPage() {
  const { data: units } = await fetchUnitsFromSupabase();
  const { data: conversions } = await fetchUnitConversionsFromSupabase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#050914] to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Unit Conversions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure how different units convert to each other. Example: 1 foot = 12 inches
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Add Conversion Form */}
          <div className="rounded-xl border border-cyan-400/20 bg-[#0c1426]/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add Conversion</h2>
            <ConversionForm units={units || []} />
          </div>

          {/* List of Conversions */}
          <div className="rounded-xl border border-cyan-400/20 bg-[#0c1426]/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Existing Conversions {conversions && <span className="text-sm text-slate-400">({conversions.length})</span>}
            </h2>
            <ConversionsList conversions={conversions || []} />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-xl border border-blue-400/20 bg-blue-500/10 p-6">
          <h3 className="font-semibold text-blue-200 mb-2">How Conversions Work</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Set a conversion factor that converts FROM the source unit TO the target unit</li>
            <li>• Example: To convert feet to inches, set source=feet, target=inches, factor=12</li>
            <li>• Reverse conversions are automatic (inches to feet = 1/12)</li>
            <li>• Conversions can chain together (feet → inches → centimeters)</li>
            <li>• When searching used materials, sizes are converted to match your search criteria</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
