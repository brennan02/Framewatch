import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
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
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              Open Dashboard
            </Link>

            <Link
              href="/inventory"
              className="rounded-xl border border-cyan-400/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111a2f]"
            >
              Log Inventory
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">Quick links:</span>
            <Link
              href="/materials"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[#111a2f]"
            >
              Materials
            </Link>
            <Link
              href="/jobs"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[#111a2f]"
            >
              Jobs
            </Link>
            <Link
              href="/reports"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-[#111a2f]"
            >
              Reports
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 text-sm text-slate-200">
          <p className="font-semibold text-cyan-200">Investor/Beta Demo Path</p>
          <p className="mt-2 leading-6 text-slate-200">
            Start in <span className="font-semibold">Scan</span> to log activity, then open{" "}
            <span className="font-semibold">Dashboard</span> and{" "}
            <span className="font-semibold">Reports</span> to show waste visibility and
            salvage impact.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Inventory In",
              text: "Log incoming lumber, siding, metal, wiring, and other tracked materials.",
              href: "/inventory",
            },
            {
              title: "Material Out",
              text: "Track what gets used on a job or building without messy paper logs.",
              href: "/inventory",
            },
            {
              title: "Waste",
              text: "Record warped boards, damaged material, and defective items.",
              href: "/waste",
            },
            {
              title: "Simple Reporting",
              text: "See where material loss is happening and what it may be costing.",
              href: "/reports",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-cyan-500/20 bg-[#0c1426]/80 p-5 hover:border-cyan-500/40 hover:bg-[#0c1426] transition-colors"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
