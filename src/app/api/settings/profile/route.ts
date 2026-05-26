import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({ name: z.string().min(1).max(80) });

export async function PATCH(req: NextRequest) {
  const { error, userId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());
  const user = await prisma.user.update({ where: { id: userId! }, data });
  return ok({ id: user.id, name: user.name, email: user.email });
}
