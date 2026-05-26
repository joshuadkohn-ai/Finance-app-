import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const patchSchema = z.object({
  merchant: z.string().optional(),
  amount: z.number().optional(),
  categoryId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isReviewed: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  isReimbursable: z.boolean().optional(),
  isBusiness: z.boolean().optional(),
  isTaxRelated: z.boolean().optional(),
  isIgnored: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const tx = await prisma.transaction.findFirst({ where: { id, householdId: householdId! } });
  if (!tx) return err("Not found", 404);

  const data = patchSchema.parse(await req.json());
  const updated = await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true, account: { select: { id: true, name: true, type: true } } },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const tx = await prisma.transaction.findFirst({ where: { id, householdId: householdId! } });
  if (!tx) return err("Not found", 404);

  await prisma.transaction.delete({ where: { id } });
  return ok({ deleted: true });
}
