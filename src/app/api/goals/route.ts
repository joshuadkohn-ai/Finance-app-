import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { GoalType } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1),
  type: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number().default(0),
  targetDate: z.string().optional().nullable(),
  monthlyContrib: z.number().default(0),
  accountId: z.string().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional(),
  note: z.string().optional(),
});

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const goals = await prisma.goal.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    include: { account: { select: { id: true, name: true, balance: true } } },
  });
  return ok(goals);
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());
  const goal = await prisma.goal.create({
    data: {
      ...data,
      type: data.type as GoalType,
      userId: userId!,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
  return ok(goal, 201);
}
