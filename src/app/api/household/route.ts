import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

export async function GET() {
  const { error, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });
  return ok(household);
}

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(["EDITOR", "VIEWER"]) });

export async function POST(req: NextRequest) {
  const { error, userId, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  // Verify requester is OWNER
  const member = await prisma.householdMember.findFirst({ where: { householdId, userId: userId!, role: "OWNER" } });
  if (!member) return err("Only owners can invite members", 403);

  const { email, role } = inviteSchema.parse(await req.json());

  let invitedUser = await prisma.user.findUnique({ where: { email } });
  if (!invitedUser) {
    // Create stub user for pending invite
    invitedUser = await prisma.user.create({ data: { email } });
  }

  const existing = await prisma.householdMember.findFirst({ where: { householdId, userId: invitedUser.id } });
  if (existing) return err("User already in household", 409);

  const invite = await prisma.householdMember.create({
    data: { householdId, userId: invitedUser.id, role, inviteEmail: email, inviteStatus: "PENDING" },
  });
  return ok(invite, 201);
}
