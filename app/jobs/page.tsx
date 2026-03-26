import Link from "next/link";
import { inventoryLogs } from "../src/lib/mock-data";

type JobSummary = {
  jobName: string;
  totalEntries: number;
  totalQuantityMoved: number;
  wasteQuantity: number;
  salvagedQuantity: number;
};

export default function JobsPage() {
  const jobSummaries = Object.values(
    inventoryLogs.reduce<Record<string, JobSummary>>((acc, log) => {
      const jobName = log.jobName?.trim();

      if (!jobName) {
        return acc;
      }

      if (!acc[jobName]) {
        acc[jobName] = {
          jobName,
          totalEntries: 0,
          totalQuantityMoved: 0,
          wasteQuantity: 0,
          salvagedQuantity: 0,
        };
      }

      acc[jobName].totalEntries += 1;
      acc[jobName].totalQuantityMoved += log.quantity;

      if (log.action === "waste") {
        acc[jobName].wasteQuantity += log.quantity;
      }

      if (log.action === "salvaged") {
        acc[jobName].salvagedQuantity += log.quantity;
      }

      return acc;
    }, {})
  ).sort((a, b) => b.totalQuantityMoved - a.totalQuantityMoved);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Jobs
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Activity by build/job
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Grouped job-level material activity from mock inventory logs for the
              Tuckertown Buildings MVP.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              Back Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-900"
            >
              Back Home
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Job activity summary</h2>

          {jobSummaries.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-base font-medium text-white">No job activity yet.</p>
              <p className="mt-2 text-sm text-slate-300">
                Add job names to inventory logs to view usage, waste, and salvage by
                build/job.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {jobSummaries.map((job) => (
                <div
                  key={job.jobName}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-white">{job.jobName}</p>
                    <p className="text-sm text-slate-300">
                      Total quantity moved: {job.totalQuantityMoved}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Logged entries
                      </p>
                      <p className="mt-1 text-lg font-bold text-white">{job.totalEntries}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Quantity moved
                      </p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {job.totalQuantityMoved}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-amber-300">
                        Waste quantity
                      </p>
                      <p className="mt-1 text-lg font-bold text-amber-200">
                        {job.wasteQuantity}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-emerald-300">
                        Salvaged quantity
                      </p>
                      <p className="mt-1 text-lg font-bold text-emerald-200">
                        {job.salvagedQuantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
