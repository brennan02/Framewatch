"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const SCANNER_DIV_ID = "fw-qr-scanner-viewport";

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    scannedRef.current = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(SCANNER_DIV_ID);
        stopRef.current = async () => {
          try {
            await scanner.stop();
          } catch {
            // Ignore stop errors when scanner never fully started
          }
        };

        const scanConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
        const onSuccess = (decodedText: string) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          scanner
            .stop()
            .then(() => onScan(decodedText.trim()))
            .catch(() => onScan(decodedText.trim()));
        };
        const onFailure = () => {
          // per-frame decode failures are normal — ignore
        };

        const cameras = await Html5Qrcode.getCameras();
        const preferredCamera =
          cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[0];

        if (!preferredCamera) {
          throw new Error("No camera found");
        }

        await scanner.start(preferredCamera.id, scanConfig, onSuccess, onFailure);

        setStarting(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        if (
          msg.toLowerCase().includes("permission") ||
          msg.toLowerCase().includes("denied")
        ) {
          setError(
            "Camera permission was denied. Allow camera access in your browser settings and try again."
          );
        } else if (
          msg.toLowerCase().includes("https") ||
          msg.toLowerCase().includes("secure")
        ) {
          setError(
            "Camera requires a secure connection (HTTPS). Use the Vercel deployment or localhost."
          );
        } else if (
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("notfound")
        ) {
          setError("No camera found on this device.");
        } else if (
          msg.toLowerCase().includes("notreadable") ||
          msg.toLowerCase().includes("could not start video")
        ) {
          setError(
            "Camera is in use by another app or tab. Close other apps using the camera and try again."
          );
        } else {
          setError(`Camera error: ${msg}`);
        }

        setStarting(false);
      }
    }

    startScanner();

    return () => {
      // Only stop if we haven't already stopped from a successful scan
      if (!scannedRef.current) {
        void stopRef.current?.();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0c1426] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
              Camera
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-white">
              Scan QR Code
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-600 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <>
            {starting ? (
              <p className="mb-3 text-xs text-slate-400">Starting camera…</p>
            ) : (
              <p className="mb-3 text-xs text-slate-400">
                Point the camera at the material QR code. It will match
                automatically.
              </p>
            )}

            {/* html5-qrcode renders its video/canvas into this div */}
            <div id={SCANNER_DIV_ID} className="overflow-hidden rounded-xl" />
          </>
        )}

        {!error && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Allow camera access when prompted
          </p>
        )}
      </div>
    </div>
  );
}
