import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  date: z.string(),
  merchant: z.string().min(1),
  amount: z.number(),
  type: z.enum(["DEBIT", "CREDIT"]),
  accountId: z.string(),
  categoryId: z.string().optional().nullable(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isReviewed: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  isReimbursable: z.boolean().default(false),
  isBusiness: z.boolean().default(false),
  isTaxRelated: z.boolean().default(false),
  isIgnored: z.boolean().default(false),
  isTransfer: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const search = url.searchParams.get("search") ?? "";
  const accountId = url.searchParams.get("accountId");
  const categoryId = url.searchParams.get("categoryId");
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  const where: Record<string, unknown> = { householdId };
  if (search) where.merchant = { contains: search, mode: "insensitive" };
  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    where.date = { gte: start, lt: end };
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, account: { select: { id: true, name: true, type: true } } },
    }),
  ]);

  return ok({ transactions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const body = await req.json();
  const data = schema.parse(body);

  // verify account belongs to household
  const account = await prisma.financialAccount.findFirst({ where: { id: data.accountId, householdId } });
  if (!account) return err("Account not found", 404);

  const tx = await prisma.transaction.create({
    data: { ...data, date: new Date(data.date), householdId },
    include: { category: true, account: { select: { id: true, name: true, type: true } } },
  });
  return ok(tx, 201);
}
