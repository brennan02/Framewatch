"use client";

type PrintBuildingQrButtonProps = {
  buildingName: string;
  specialId: string;
  qrValue: string;
};

function getQrImageUrl(qrValue: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrValue)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function PrintBuildingQrButton({ buildingName, specialId, qrValue }: PrintBuildingQrButtonProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");

    if (!printWindow) {
      window.alert("Unable to open print window. Please allow pop-ups and try again.");
      return;
    }

    const qrImageUrl = getQrImageUrl(qrValue);
    const safeName = escapeHtml(buildingName);
    const safeSpecialId = escapeHtml(specialId);
    const safeQrValue = escapeHtml(qrValue);
    const printedAt = new Date().toLocaleString();

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Building QR - ${safeSpecialId}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Segoe UI", Arial, sans-serif;
              background: #ffffff;
              color: #111827;
              padding: 24px;
            }
            .label {
              width: 4in;
              min-height: 6in;
              border: 2px solid #111827;
              border-radius: 12px;
              padding: 16px;
              display: grid;
              gap: 12px;
              align-content: start;
            }
            .heading {
              font-size: 12px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              font-weight: 700;
              color: #374151;
            }
            .name {
              font-size: 24px;
              font-weight: 800;
              line-height: 1.2;
              word-break: break-word;
            }
            .special {
              font-size: 20px;
              font-weight: 700;
              color: #0f766e;
            }
            .qr {
              width: 100%;
              max-width: 300px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 8px;
              background: #ffffff;
            }
            .meta {
              font-size: 12px;
              color: #4b5563;
              word-break: break-word;
            }
            @media print {
              body { padding: 0; }
              .label {
                border: 2px solid #000;
                border-radius: 0;
                width: 100%;
                min-height: 100vh;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="heading">FrameWatch Building Tag</div>
            <div class="name">${safeName}</div>
            <div class="special">${safeSpecialId}</div>
            <img class="qr" src="${qrImageUrl}" alt="QR code for ${safeName}" />
            <div class="meta">QR Payload: ${safeQrValue}</div>
            <div class="meta">Printed: ${escapeHtml(printedAt)}</div>
          </div>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
    >
      Print QR Label
    </button>
  );
}
