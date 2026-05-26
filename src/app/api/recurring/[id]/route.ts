import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  merchant: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(["KEEP", "CANCEL", "REVIEW"]).optional(),
  nextDueDate: z.string().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const rec = await prisma.recurringTransaction.findFirst({ where: { id, householdId: householdId! } });
  if (!rec) return err("Not found", 404);

  const data = schema.parse(await req.json());
  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: { ...data, nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const rec = await prisma.recurringTransaction.findFirst({ where: { id, householdId: householdId! } });
  if (!rec) return err("Not found", 404);

  await prisma.recurringTransaction.delete({ where: { id } });
  return ok({ deleted: true });
}
