"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/materials", label: "Materials" },
    { href: "/used-materials", label: "Used Materials" },
    { href: "/waste", label: "Waste" },
    { href: "/categories", label: "Categories" },
    { href: "/units", label: "Units" },
    { href: "/jobs", label: "Jobs" },
  ];

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/20 bg-[#050914] backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-xl font-bold text-cyan-400">FrameWatch</div>
          <div className="text-xs uppercase tracking-widest text-slate-400">MVP</div>
        </Link>

        {/* Navigation Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-[#050914] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
          >
            <span>Navigation</span>
            <svg
              className={`h-4 w-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-cyan-400/30 bg-[#0a1120] shadow-lg">
              {navItems.map((item) => {
                const isActive = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDropdownOpen(false)}
                    className={`block px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-l-2 border-cyan-400 bg-cyan-500/10 text-cyan-200"
                        : "border-l-2 border-transparent text-slate-300 hover:bg-[#111a2f]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="border-t border-cyan-400/20 px-4 py-3">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
