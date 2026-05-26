import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).optional(),
  balance: z.number().optional(),
  interestRate: z.number().optional(),
  minimumPayment: z.number().optional(),
  creditLimit: z.number().optional(),
  isHidden: z.boolean().optional(),
  excludeFromBudget: z.boolean().optional(),
  excludeFromNetWorth: z.boolean().optional(),
  color: z.string().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const account = await prisma.financialAccount.findFirst({ where: { id, householdId: householdId! } });
  if (!account) return err("Not found", 404);

  const body = await req.json();
  const data = schema.parse(body);
  const updated = await prisma.financialAccount.update({ where: { id }, data });

  if (data.balance !== undefined && data.balance !== account.balance) {
    await prisma.netWorthSnapshot.create({ data: { accountId: id, balance: data.balance } });
  }
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const account = await prisma.financialAccount.findFirst({ where: { id, householdId: householdId! } });
  if (!account) return err("Not found", 404);

  await prisma.financialAccount.delete({ where: { id } });
  return ok({ deleted: true });
}
