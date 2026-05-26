import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  opts?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function clampPercent(value: number, max = 100): number {
  return Math.min(Math.max(value, 0), max);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function sumBy<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((s, item) => s + fn(item), 0);
}

export function isAsset(type: string): boolean {
  return ["CHECKING", "SAVINGS", "INVESTMENT", "RETIREMENT", "CRYPTO", "REAL_ESTATE", "VEHICLE", "CASH", "OTHER_ASSET"].includes(type);
}

export function isLiability(type: string): boolean {
  return ["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER_LIABILITY"].includes(type);
}

export function accountTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CHECKING: "Checking",
    SAVINGS: "Savings",
    CREDIT_CARD: "Credit Card",
    LOAN: "Loan",
    MORTGAGE: "Mortgage",
    INVESTMENT: "Investment",
    RETIREMENT: "Retirement",
    CRYPTO: "Crypto",
    REAL_ESTATE: "Real Estate",
    VEHICLE: "Vehicle",
    CASH: "Cash",
    OTHER_ASSET: "Other Asset",
    OTHER_LIABILITY: "Other Liability",
  };
  return map[type] ?? type;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
