import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ok, err } from "@/lib/api-helpers";

// CSV import endpoint
// Expects: multipart/form-data with file, accountId, and column mapping
export async function POST(req: NextRequest) {
  const { error, userId, householdId } = await requireAuth();
  if (error) return error;
  if (!householdId) return err("No household", 404);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;
  const mapping = JSON.parse((formData.get("mapping") as string) ?? "{}") as Record<string, string>;

  if (!file || !accountId) return err("file and accountId required", 400);

  const account = await prisma.financialAccount.findFirst({ where: { id: accountId, householdId } });
  if (!account) return err("Account not found", 404);

  const text = await file.text();
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

  // column mapping: { date, merchant, amount, type }
  const dateCol = headers.indexOf(mapping.date ?? "Date");
  const merchantCol = headers.indexOf(mapping.merchant ?? "Description");
  const amountCol = headers.indexOf(mapping.amount ?? "Amount");

  let imported = 0;
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
    const dateStr = cols[dateCol];
    const merchant = cols[merchantCol];
    const amountStr = cols[amountCol];

    if (!dateStr || !merchant || !amountStr) { skipped++; continue; }

    const amount = Math.abs(parseFloat(amountStr));
    if (isNaN(amount)) { skipped++; continue; }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) { skipped++; continue; }

    const type = parseFloat(amountStr) < 0 ? "DEBIT" : "CREDIT";

    // Dedup check
    const exists = await prisma.transaction.findFirst({
      where: { accountId, date, merchant, amount },
    });
    if (exists) { skipped++; continue; }

    await prisma.transaction.create({
      data: { householdId, accountId, date, merchant, amount, type },
    });
    imported++;
  }

  await prisma.uploadedFile.create({
    data: {
      userId: userId!,
      filename: file.name,
      mimetype: file.type || "text/csv",
      size: file.size,
      url: "",
      status: "DONE",
      rowsImported: imported,
      rowsSkipped: skipped,
    },
  });

  return ok({ imported, skipped });
}
