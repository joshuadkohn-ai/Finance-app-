import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
  })),
  categoryId: z.string().optional().nullable(),
  setMerchant: z.string().optional(),
  setTags: z.array(z.string()).default([]),
  setReviewed: z.boolean().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
});

export async function GET() {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const rules = await prisma.rule.findMany({
    where: { userId: userId! },
    include: { category: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return ok(rules);
}

export async function POST(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());
  const rule = await prisma.rule.create({ data: { ...data, userId: userId! } });
  return ok(rule, 201);
}
