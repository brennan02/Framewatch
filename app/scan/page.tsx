"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { materials } from "../src/lib/mock-data";
import { useDemoState } from "../src/components/demo-state-provider";
import { TopNavLinks } from "../src/components/top-nav-links";
import type { InventoryAction, InventoryLog } from "../src/types/inventory";

const actionOptions: { value: InventoryAction; label: string }[] = [
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "partial", label: "Partial" },
  { value: "waste", label: "Waste" },
  { value: "salvaged", label: "Salvaged" },
];

export default function ScanPage() {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [materialCodeInput, setMaterialCodeInput] = useState("");
  const [codeLookupTouched, setCodeLookupTouched] = useState(false);
  const [action, setAction] = useState<InventoryAction>("in");
  const [quantity, setQuantity] = useState("1");
  const [jobName, setJobName] = useState("");
  const [note, setNote] = useState("");
  const { logs, addLog } = useDemoState();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === materialId),
    [materialId]
  );
  const normalizedCodeInput = materialCodeInput.trim().toUpperCase();
  const matchedMaterialByCode = useMemo(
    () =>
      materials.find(
        (material) => material.scanCode.toUpperCase() === normalizedCodeInput
      ),
    [normalizedCodeInput]
  );

  const quantityValue = Number(quantity);
  const materialInvalid = !materialId;
  const actionInvalid = !action;
  const quantityInvalid = !quantity || Number.isNaN(quantityValue) || quantityValue <= 0;
  const formInvalid = materialInvalid || actionInvalid || quantityInvalid;

  const recentEntries = [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((log) => ({
      ...log,
      materialName:
        materials.find((material) => material.id === log.materialId)?.name ??
        "Unknown Material",
    }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Scan Flow
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Material scan workflow
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Manual scan mode for MVP. This simulates the future QR flow and logs
              material actions using mock data.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-5">
          <TopNavLinks currentPath="/scan" />
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Manual Material Log</h2>

          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitAttempted(true);
              setConfirmationMessage("");

              if (formInvalid) {
                return;
              }

              const newEntry: InventoryLog = {
                id: `log-temp-${Date.now()}`,
                materialId,
                action,
                quantity: quantityValue,
                ...(jobName.trim() ? { jobName: jobName.trim() } : {}),
                ...(note.trim() ? { note: note.trim() } : {}),
                createdAt: new Date().toISOString(),
              };

              addLog(newEntry);
              setQuantity("1");
              setJobName("");
              setNote("");
              setSubmitAttempted(false);
              setConfirmationMessage("Scan entry added to this session's recent logs.");
            }}
          >
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Material Code (Simulated QR)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={materialCodeInput}
                  onChange={(event) => {
                    setMaterialCodeInput(event.target.value);
                    setCodeLookupTouched(false);
                  }}
                  placeholder="Paste or type code (e.g. FW-LUM-2408)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCodeLookupTouched(true);

                    if (matchedMaterialByCode) {
                      setMaterialId(matchedMaterialByCode.id);
                    }
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Match Code
                </button>
              </div>
              {codeLookupTouched && normalizedCodeInput && matchedMaterialByCode ? (
                <span className="text-xs text-emerald-300">
                  Code matched: {matchedMaterialByCode.name} ({matchedMaterialByCode.sku})
                </span>
              ) : null}
              {codeLookupTouched && normalizedCodeInput && !matchedMaterialByCode ? (
                <span className="text-xs text-red-400">
                  No material found for that code. Check the value or select manually.
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Material</span>
              <select
                value={materialId}
                onChange={(event) => setMaterialId(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              >
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.sku}) • {material.scanCode}
                  </option>
                ))}
              </select>
              {submitAttempted && materialInvalid ? (
                <span className="text-xs text-red-400">Material is required.</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Action</span>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value as InventoryAction)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {submitAttempted && actionInvalid ? (
                <span className="text-xs text-red-400">Action is required.</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Quantity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              />
              {submitAttempted && quantityInvalid ? (
                <span className="text-xs text-red-400">
                  Quantity is required and must be greater than 0.
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Job Name</span>
              <input
                type="text"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                placeholder="e.g. Cabin A12"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional context for this scan"
                rows={3}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl border border-amber-500 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              Simulate Scan Entry
            </button>

            {confirmationMessage ? (
              <p className="text-sm text-emerald-300">{confirmationMessage}</p>
            ) : null}
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Demo Material Codes</h2>
          <p className="mt-2 text-sm text-slate-300">
            Use these sample codes to simulate a QR scan lookup.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {materials.map((material) => (
              <li
                key={material.id}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <span className="font-semibold text-amber-300">{material.scanCode}</span>{" "}
                <span className="text-slate-400">→</span> {material.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Live Preview</h2>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <p>
              <span className="text-slate-400">Material:</span>{" "}
              <span className="font-semibold text-white">
                {selectedMaterial?.name ?? "No material selected"}
              </span>
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Action:</span>{" "}
              <span className="uppercase tracking-wide text-amber-400">{action}</span>
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Quantity:</span>{" "}
              {quantityInvalid ? "Invalid quantity" : `${quantityValue} ${selectedMaterial?.unit ?? "units"}`}
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Job:</span> {jobName || "Not specified"}
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Note:</span> {note || "No note"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Recent Simulated Entries</h2>
          <div className="mt-4 space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{entry.materialName}</p>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                    {entry.action}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Quantity: {entry.quantity}
                  {entry.jobName ? ` • Job: ${entry.jobName}` : ""}
                </p>
                {entry.note ? <p className="mt-1 text-xs text-slate-400">{entry.note}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
