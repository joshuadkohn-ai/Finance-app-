import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  balance: z.number().optional(),
  minimumPayment: z.number().optional(),
  interestRate: z.number().optional(),
  payoffStrategy: z.enum(["AVALANCHE", "SNOWBALL"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({ where: { id, userId: userId! } });
  if (!debt) return err("Not found", 404);

  const data = schema.parse(await req.json());
  const updated = await prisma.debt.update({ where: { id }, data });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const debt = await prisma.debt.findFirst({ where: { id, userId: userId! } });
  if (!debt) return err("Not found", 404);

  await prisma.debt.delete({ where: { id } });
  return ok({ deleted: true });
}
