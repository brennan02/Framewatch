"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";

type QRScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
};

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup scanner when modal closes
      if (scannerRef.current) {
        scannerRef.current.clear();
        setIsInitialized(false);
      }
      return;
    }

    // Initialize scanner only when modal opens
    if (!isInitialized && isOpen) {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          true
        );

        scanner.render(
          (decodedText) => {
            // Extract SKU from QR code data
            // Assumes QR contains SKU directly or material ID
            onScan(decodedText);
            setError(null);
          },
          (error) => {
            // Errors during scanning - ignore these, they're expected
            // Only show errors from initialization
          }
        );

        scannerRef.current = scanner;
        setIsInitialized(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize camera";
        setError(errorMessage);
      }
    }

    return () => {
      if (scannerRef.current && isInitialized) {
        scannerRef.current.clear();
      }
    };
  }, [isOpen, isInitialized, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/30 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div
          id="qr-scanner-container"
          className="mb-4 rounded-lg overflow-hidden border border-cyan-400/30"
        />

        <div className="text-center text-sm text-slate-400">
          <p>Point camera at QR code to scan</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-slate-400/50 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
