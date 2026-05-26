import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { AccountType } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1),
  type: z.string(),
  subtype: z.string().optional(),
  institution: z.string().optional(),
  balance: z.number(),
  currency: z.string().default("USD"),
  interestRate: z.number().optional(),
  minimumPayment: z.number().optional(),
  creditLimit: z.number().optional(),
  color: z.string().optional(),
  note: z.string().optional(),
  excludeFromBudget: z.boolean().default(false),
  excludeFromNetWorth: z.boolean().default(false),
});

export async function GET() {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household found", 404);

  const accounts = await prisma.financialAccount.findMany({
    where: { householdId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { holdings: true },
  });
  return ok(accounts);
}

export async function POST(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household found", 404);

  const body = await req.json();
  const data = schema.parse(body);
  const account = await prisma.financialAccount.create({
    data: { ...data, type: data.type as AccountType, householdId },
  });

  // snapshot initial balance
  await prisma.netWorthSnapshot.create({ data: { accountId: account.id, balance: account.balance } });

  return ok(account, 201);
}
