"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TopNavLinksProps = {
  currentPath: string;
};

const primaryNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
];

const secondaryNavItems = [
  { href: "/materials", label: "Materials" },
  { href: "/used-materials", label: "Used Materials" },
  { href: "/waste", label: "Waste" },
  { href: "/categories", label: "Categories" },
  { href: "/units", label: "Units" },
  { href: "/units/conversions", label: "Unit Conversions" },
  { href: "/jobs", label: "Jobs" },
  { href: "/job-types", label: "Job Types" },
  { href: "/buildings", label: "Buildings" },
  { href: "/jobs/standards", label: "Job Standards" },
];

export function TopNavLinks({ currentPath }: TopNavLinksProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const isRouteActive = (href: string) =>
    href === currentPath || 
    (href === "/materials" && currentPath.startsWith("/materials/")) || 
    (href === "/used-materials" && currentPath.startsWith("/used-materials")) ||
    (href === "/categories" && currentPath.startsWith("/categories/")) ||
    (href === "/units" && currentPath.startsWith("/units/") && !currentPath.startsWith("/units/conversions")) ||
    (href === "/units/conversions" && currentPath.startsWith("/units/conversions")) ||
    (href === "/jobs" && currentPath.startsWith("/jobs/") && !currentPath.startsWith("/jobs/standards")) ||
    (href === "/job-types" && currentPath.startsWith("/job-types")) ||
    (href === "/buildings" && currentPath.startsWith("/buildings")) ||
    (href === "/jobs/standards" && currentPath.startsWith("/jobs/standards"));

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

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}
