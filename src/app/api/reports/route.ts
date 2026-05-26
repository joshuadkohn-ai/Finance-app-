import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "spending";
  const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  if (type === "spending") {
    const txns = await prisma.transaction.findMany({
      where: { householdId, date: { gte: start, lt: end }, isIgnored: false, type: "DEBIT" },
      include: { category: { include: { group: true } } },
    });

    const byCategory: Record<string, { name: string; amount: number; emoji?: string | null; group?: string }> = {};
    for (const tx of txns) {
      const key = tx.categoryId ?? "uncategorized";
      const name = tx.category?.name ?? "Uncategorized";
      if (!byCategory[key]) byCategory[key] = { name, amount: 0, emoji: tx.category?.emoji, group: tx.category?.group?.name };
      byCategory[key].amount += tx.amount;
    }

    const categories = Object.values(byCategory).sort((a, b) => b.amount - a.amount);
    const totalSpent = categories.reduce((s, c) => s + c.amount, 0);
    return ok({ categories, totalSpent });
  }

  if (type === "cashflow") {
    // Last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const txns = await prisma.transaction.findMany({
        where: { householdId, date: { gte: mStart, lt: mEnd }, isIgnored: false },
        select: { amount: true, type: true },
      });
      const income = txns.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
      months.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        year: d.getFullYear(),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return ok({ months });
  }

  if (type === "networth") {
    const accounts = await prisma.financialAccount.findMany({
      where: { householdId, excludeFromNetWorth: false },
      include: { netWorthSnapshots: { orderBy: { date: "asc" }, take: 30 } },
    });
    return ok({ accounts });
  }

  return ok({});
}
