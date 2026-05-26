import { auth } from "./auth";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), userId: null, householdId: null };
  }
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, inviteStatus: "ACCEPTED" },
    select: { householdId: true },
  });
  return { error: null, userId: session.user.id, householdId: member?.householdId ?? null };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
