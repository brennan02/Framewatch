export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            FrameWatch MVP
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Track material usage, waste, and loss without slowing down the jobsite.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            FrameWatch is a material accountability system for builders. The MVP is
            being built first for Tuckertown Buildings to track lumber, siding,
            wiring, salvage, and waste with a simple scan-based workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/dashboard"
              className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              View Dashboard
            </a>

            <a
              href="/scan"
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Open Scan Flow
            </a>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Inventory In",
              text: "Log incoming lumber, siding, metal, wiring, and other tracked materials.",
            },
            {
              title: "Material Out",
              text: "Track what gets used on a job or building without messy paper logs.",
            },
            {
              title: "Waste & Partial Use",
              text: "Record warped boards, damaged material, cutoffs, and salvage value.",
            },
            {
              title: "Simple Reporting",
              text: "See where material loss is happening and what it may be costing.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
