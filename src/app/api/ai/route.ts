import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

// AI Assistant endpoint - uses Anthropic Claude API
// Requires ANTHROPIC_API_KEY in env
export async function POST(req: NextRequest) {
  const { error, userId, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const { message } = await req.json();
  if (!message) return err("Message required", 400);

  // Gather financial context (keep small for token efficiency)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, txns, goals, budget] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { householdId, isHidden: false },
      select: { name: true, type: true, balance: true, currency: true },
    }),
    prisma.transaction.findMany({
      where: { householdId, date: { gte: monthStart, lt: monthEnd }, isIgnored: false },
      select: { merchant: true, amount: true, type: true, category: { select: { name: true } } },
      orderBy: { amount: "desc" },
      take: 50,
    }),
    prisma.goal.findMany({
      where: { userId: userId! },
      select: { name: true, type: true, targetAmount: true, currentAmount: true, targetDate: true },
    }),
    prisma.budget.findFirst({
      where: { userId: userId!, month: now.getMonth() + 1, year: now.getFullYear() },
      select: { income: true, categories: { include: { category: { select: { name: true } } } } },
    }),
  ]);

  const totalAssets = accounts.filter((a) => ["CHECKING","SAVINGS","INVESTMENT","RETIREMENT","CRYPTO","REAL_ESTATE","VEHICLE","CASH","OTHER_ASSET"].includes(a.type)).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => ["CREDIT_CARD","LOAN","MORTGAGE","OTHER_LIABILITY"].includes(a.type)).reduce((s, a) => s + a.balance, 0);
  const monthIncome = txns.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const monthSpend = txns.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  const context = `
User's financial snapshot (${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}):
- Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)} (Assets: $${totalAssets.toFixed(2)}, Liabilities: $${totalLiabilities.toFixed(2)})
- This month income: $${monthIncome.toFixed(2)}, spending: $${monthSpend.toFixed(2)}
- Accounts: ${accounts.map((a) => `${a.name} (${a.type}): $${a.balance.toFixed(2)}`).join(", ")}
- Top spending this month: ${txns.filter((t) => t.type === "DEBIT").slice(0, 10).map((t) => `${t.merchant} $${t.amount.toFixed(2)} [${t.category?.name ?? "?"}]`).join(", ")}
- Goals: ${goals.map((g) => `${g.name}: $${g.currentAmount.toFixed(0)}/$${g.targetAmount.toFixed(0)}`).join(", ")}
- Budget income: $${(budget?.income ?? 0).toFixed(2)}
`.trim();

  // If no API key, return a helpful mock response
  if (!process.env.ANTHROPIC_API_KEY) {
    const mockResponses: Record<string, string> = {
      spend: `Based on your data, you've spent **$${monthSpend.toFixed(2)}** this month across ${txns.filter((t) => t.type === "DEBIT").length} transactions. Your top categories include dining, groceries, and subscriptions.`,
      afford: `With a net worth of **$${(totalAssets - totalLiabilities).toFixed(2)}** and monthly income of **$${monthIncome.toFixed(2)}**, I can help you evaluate affordability. Please add your ANTHROPIC_API_KEY for detailed AI analysis.`,
      default: `I can see your financial data: Net worth **$${(totalAssets - totalLiabilities).toFixed(2)}**, this month's spending **$${monthSpend.toFixed(2)}**, income **$${monthIncome.toFixed(2)}**. Add your ANTHROPIC_API_KEY to .env for full AI-powered responses.`,
    };
    const lower = message.toLowerCase();
    const response = lower.includes("spend") ? mockResponses.spend : lower.includes("afford") ? mockResponses.afford : mockResponses.default;
    return ok({ response, context: "Mock response — add ANTHROPIC_API_KEY for full AI" });
  }

  // Real Anthropic call
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: `You are MoneyMap's AI financial assistant. Answer the user's financial questions using ONLY their actual data below. Be concise, specific, and show calculations. Never give regulated financial advice — suggest consulting a CFP for major decisions.\n\n${context}`,
      messages: [{ role: "user", content: message }],
    }),
  });

  if (!anthropicRes.ok) return err("AI service error", 502);
  const aiData = await anthropicRes.json();
  const response = aiData.content?.[0]?.text ?? "I couldn't generate a response.";
  return ok({ response });
}
