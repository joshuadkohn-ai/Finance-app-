import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const budgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  mode: z.enum(["FLEXIBLE", "ZERO_BASED"]).default("FLEXIBLE"),
  income: z.number().default(0),
  categories: z.array(z.object({
    categoryId: z.string(),
    planned: z.number(),
    rollover: z.boolean().default(false),
    isFixed: z.boolean().default(false),
  })).default([]),
});

export async function GET(req: NextRequest) {
  const { error, userId, householdId } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());

  const budget = await prisma.budget.findFirst({
    where: { userId: userId!, month, year },
    include: { categories: { include: { category: true } } },
  });

  if (!budget) return ok(null);

  // Calculate actuals from transactions
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const txns = await prisma.transaction.findMany({
    where: { householdId: householdId!, date: { gte: start, lt: end }, isIgnored: false },
    select: { categoryId: true, amount: true, type: true },
  });

  const actuals: Record<string, number> = {};
  for (const tx of txns) {
    if (!tx.categoryId) continue;
    actuals[tx.categoryId] = (actuals[tx.categoryId] ?? 0) + (tx.type === "DEBIT" ? tx.amount : -tx.amount);
  }

  const enriched = budget.categories.map((bc) => ({
    ...bc,
    actual: actuals[bc.categoryId] ?? 0,
  }));

  return ok({ ...budget, categories: enriched });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { categories, ...data } = budgetSchema.parse(body);

  const budget = await prisma.budget.upsert({
    where: { userId_month_year: { userId: userId!, month: data.month, year: data.year } },
    create: { ...data, userId: userId! },
    update: { income: data.income, mode: data.mode },
  });

  // Upsert budget categories
  for (const cat of categories) {
    await prisma.budgetCategory.upsert({
      where: { budgetId_categoryId: { budgetId: budget.id, categoryId: cat.categoryId } },
      create: { budgetId: budget.id, ...cat },
      update: { planned: cat.planned, rollover: cat.rollover, isFixed: cat.isFixed },
    });
  }

  return ok(budget, 201);
}
