import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  accountId: z.string(),
  merchant: z.string().min(1),
  amount: z.number(),
  type: z.enum(["DEBIT", "CREDIT"]),
  categoryId: z.string().optional().nullable(),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  dayOfMonth: z.number().optional().nullable(),
  nextDueDate: z.string(),
  notes: z.string().optional(),
  status: z.enum(["KEEP", "CANCEL", "REVIEW"]).default("KEEP"),
});

export async function GET() {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const recurring = await prisma.recurringTransaction.findMany({
    where: { householdId, isActive: true },
    orderBy: { nextDueDate: "asc" },
  });
  return ok(recurring);
}

export async function POST(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const data = schema.parse(await req.json());
  const recurring = await prisma.recurringTransaction.create({
    data: { ...data, householdId, nextDueDate: new Date(data.nextDueDate), isManual: true },
  });
  return ok(recurring, 201);
}
