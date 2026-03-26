import Link from "next/link";

type TopNavLinksProps = {
  currentPath: string;
};

const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scan", label: "Scan" },
];

const secondaryNavItems = [
  { href: "/materials", label: "Materials" },
  { href: "/jobs", label: "Jobs" },
  { href: "/reports", label: "Reports" },
];

export function TopNavLinks({ currentPath }: TopNavLinksProps) {
  const isRouteActive = (href: string) =>
    href === currentPath || (href === "/materials" && currentPath.startsWith("/materials/"));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href="/"
          className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
            currentPath === "/"
              ? "border-amber-500/70 bg-amber-500/10 text-amber-300"
              : "border-slate-700 text-slate-200 hover:bg-slate-900"
          }`}
        >
          Home
        </Link>

        {primaryNavItems.map((item) => {
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-amber-500/70 bg-amber-500/10 text-amber-300"
                  : "border-slate-700 text-slate-200 hover:bg-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
        <span className="uppercase tracking-wide text-slate-500">More</span>
        {secondaryNavItems.map((item) => {
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`underline-offset-4 transition hover:underline ${
                isActive ? "font-semibold text-amber-300 no-underline" : "text-slate-300"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Demo mode: data is mocked and can reset when the session reloads.
      </p>
    </div>
  );
}
