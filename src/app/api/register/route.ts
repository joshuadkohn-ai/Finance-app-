import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    // Create a default household for the user
    const household = await prisma.household.create({ data: { name: `${name}'s Household` } });
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: user.id, role: "OWNER", inviteStatus: "ACCEPTED" },
    });

    // Seed default category groups and categories
    const { DEFAULT_CATEGORY_GROUPS, DEFAULT_CATEGORIES } = await import("@/lib/constants");
    const groupMap: Record<string, string> = {};
    for (const g of DEFAULT_CATEGORY_GROUPS) {
      const created = await prisma.categoryGroup.create({
        data: { userId: user.id, name: g.name, icon: g.icon, isSystem: true },
      });
      groupMap[g.name] = created.id;
    }
    for (const c of DEFAULT_CATEGORIES) {
      await prisma.category.create({
        data: {
          userId: user.id,
          groupId: groupMap[c.group],
          name: c.name,
          emoji: c.emoji,
          isSystem: true,
          isIncome: c.isIncome,
        },
      });
    }

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
