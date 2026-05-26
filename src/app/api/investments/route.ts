import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

const schema = z.object({
  accountId: z.string(),
  symbol: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number(),
  costBasis: z.number(),
  currentPrice: z.number(),
  assetClass: z.enum(["STOCK", "ETF", "BOND", "CRYPTO", "CASH", "REAL_ESTATE", "ALTERNATIVE", "OTHER"]).default("STOCK"),
});

export async function GET() {
  const { error, householdId } = await requireAuth();
  if (error) return error;

  const accounts = await prisma.financialAccount.findMany({
    where: { householdId: householdId!, type: { in: ["INVESTMENT", "RETIREMENT", "CRYPTO"] } },
    include: { holdings: true },
  });
  return ok(accounts);
}

export async function POST(req: NextRequest) {
  const { error, householdId } = await requireAuth();
  if (error) return error;

  const data = schema.parse(await req.json());

  // verify account belongs to household
  const account = await prisma.financialAccount.findFirst({ where: { id: data.accountId, householdId: householdId! } });
  if (!account) return err("Account not found", 404);

  const holding = await prisma.investmentHolding.create({ data });
  return ok(holding, 201);
}
