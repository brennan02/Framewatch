"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createConversionAction } from "../actions/conversion";

export function ConversionForm({ units }: { units: string[] }) {
  const { pending } = useFormStatus();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const [sourceUnit, setSourceUnit] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [factor, setFactor] = useState("");

  return (
    <form action={createConversionAction} className="space-y-4">
      {status === "success" && (
        <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3 text-sm text-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          From Unit (Source) *
        </label>
        <select
          name="sourceUnit"
          value={sourceUnit}
          onChange={(e) => setSourceUnit(e.target.value)}
          required
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Select source unit...</option>
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          To Unit (Target) *
        </label>
        <select
          name="targetUnit"
          value={targetUnit}
          onChange={(e) => setTargetUnit(e.target.value)}
          required
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Select target unit...</option>
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Conversion Factor *
        </label>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400 min-w-fit">1</div>
          <div className="flex-1 rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-sm text-slate-300">
            {sourceUnit || "(source unit)"}
          </div>
          <div className="text-sm text-slate-400">=</div>
          <input
            type="number"
            name="conversionFactor"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            required
            min="0"
            step="0.0001"
            placeholder="12"
            className="w-24 rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
          />
          <div className="flex-1 rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-sm text-slate-300">
            {targetUnit || "(target unit)"}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Example: 1 foot = 12 inches (enter 12)
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Description (optional)
        </label>
        <input
          type="text"
          name="description"
          placeholder="e.g., Imperial to metric"
          className="w-full rounded-lg border border-cyan-400/30 bg-[#0f1729] px-3 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-green-400/60 bg-green-500/10 px-4 py-2 font-semibold text-green-200 hover:bg-green-500/20 disabled:opacity-50 text-sm"
      >
        {pending ? "Creating..." : "Create Conversion"}
      </button>
    </form>
  );
}
