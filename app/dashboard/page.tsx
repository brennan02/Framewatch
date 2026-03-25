export default function DashboardPage() {
  const stats = [
    { label: "Materials Logged In", value: "0" },
    { label: "Materials Used", value: "0" },
    { label: "Waste Events", value: "0" },
    { label: "Salvaged Items", value: "0" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              FrameWatch overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              This dashboard will later show live material usage, waste, salvage,
              and loss trends for Tuckertown Buildings.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
          >
            Back Home
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Top Material Loss Areas</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This section will surface the materials and jobs with the highest
              waste, damage, or partial-use rates.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This section will later list recent scan events, inventory changes,
              and waste reports from the field.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}