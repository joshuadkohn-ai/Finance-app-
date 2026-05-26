import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().optional(),
  targetAmount: z.number().optional(),
  currentAmount: z.number().optional(),
  targetDate: z.string().nullable().optional(),
  monthlyContrib: z.number().optional(),
  isCompleted: z.boolean().optional(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const goal = await prisma.goal.findFirst({ where: { id, userId: userId! } });
  if (!goal) return err("Not found", 404);

  const data = schema.parse(await req.json());
  const updated = await prisma.goal.update({
    where: { id },
    data: { ...data, targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate === null ? null : undefined },
  });
  return ok(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, userId } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const goal = await prisma.goal.findFirst({ where: { id, userId: userId! } });
  if (!goal) return err("Not found", 404);

  await prisma.goal.delete({ where: { id } });
  return ok({ deleted: true });
}
