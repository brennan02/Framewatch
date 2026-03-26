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
  { href: "/categories", label: "Categories" },
  { href: "/units", label: "Units" },
  { href: "/jobs", label: "Jobs" },
  { href: "/reports", label: "Reports" },
];

export function TopNavLinks({ currentPath }: TopNavLinksProps) {
  const isRouteActive = (href: string) =>
    href === currentPath || 
    (href === "/materials" && currentPath.startsWith("/materials/")) || 
    (href === "/categories" && currentPath.startsWith("/categories/")) ||
    (href === "/units" && currentPath.startsWith("/units/"));

  const navButtonClassName = (isActive: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "border-cyan-400/70 bg-cyan-500/10 text-cyan-200"
        : "border-cyan-400/30 text-slate-200 hover:bg-[#111a2f]"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <Link
          href="/"
          className={navButtonClassName(currentPath === "/")}
        >
          Home
        </Link>

        {primaryNavItems.map((item) => {
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={navButtonClassName(isActive)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-500">More</span>
        {secondaryNavItems.map((item) => {
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={navButtonClassName(isActive)}
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
