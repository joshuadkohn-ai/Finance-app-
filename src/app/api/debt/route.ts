import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { DebtType } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1),
  type: z.string(),
  balance: z.number(),
  originalBalance: z.number().optional(),
  interestRate: z.number(),
  minimumPayment: z.number(),
  dueDay: z.number().optional(),
  payoffStrategy: z.enum(["AVALANCHE", "SNOWBALL"]).default("AVALANCHE"),
});

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const debts = await prisma.debt.findMany({
    where: { userId: userId! },
    orderBy: { interestRate: "desc" },
  });
  return ok(debts);
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());
  const debt = await prisma.debt.create({ data: { ...data, type: data.type as DebtType, userId: userId! } });
  return ok(debt, 201);
}
