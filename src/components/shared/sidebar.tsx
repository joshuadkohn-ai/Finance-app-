"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Landmark, ArrowLeftRight, PieChart, Target, RefreshCw,
  TrendingUp, BarChart2, CreditCard, FileBarChart, Sparkles, Users, Settings,
  ChevronLeft, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Landmark, ArrowLeftRight, PieChart, Target, RefreshCw,
  TrendingUp, BarChart2, CreditCard, FileBarChart, Sparkles, Users, Settings,
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/accounts", label: "Accounts", icon: "Landmark" },
  { href: "/transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { href: "/budget", label: "Budget", icon: "PieChart" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/recurring", label: "Recurring", icon: "RefreshCw" },
  { href: "/cashflow", label: "Cash Flow", icon: "TrendingUp" },
  { href: "/investments", label: "Investments", icon: "BarChart2" },
  { href: "/debt", label: "Debt", icon: "CreditCard" },
  { href: "/reports", label: "Reports", icon: "FileBarChart" },
  { href: "/ai", label: "AI Assistant", icon: "Sparkles" },
  { href: "/household", label: "Household", icon: "Users" },
  { href: "/settings", label: "Settings", icon: "Settings" },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Map className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">MoneyMap</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const Icon = ICONS[icon];
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
