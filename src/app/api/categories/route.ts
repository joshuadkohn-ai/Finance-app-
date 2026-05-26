import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1),
  groupId: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
  isIncome: z.boolean().default(false),
});

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const [groups, categories] = await Promise.all([
    prisma.categoryGroup.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isSystem: true }] },
      orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  return ok({ groups, categories });
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());
  const category = await prisma.category.create({ data: { ...data, userId } });
  return ok(category, 201);
}
