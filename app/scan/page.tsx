export default function ScanPage() {
  const actions = [
    "Log inventory in",
    "Log inventory out",
    "Mark as partial use",
    "Mark as waste",
    "Mark as salvaged",
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Scan Flow
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Material scan workflow
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This is where staff will scan a QR code and choose what happened to
              the material.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
          >
            Back Home
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8">
          <div className="flex min-h-52 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-center">
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              QR scanner placeholder. Next we’ll wire this page into the camera and
              actual material lookup flow.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <button
                key={action}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-900"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}