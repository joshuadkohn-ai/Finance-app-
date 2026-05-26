import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORY_GROUPS = [
  { name: "Housing", icon: "🏠" },
  { name: "Food & Dining", icon: "🍽️" },
  { name: "Transportation", icon: "🚗" },
  { name: "Health", icon: "💊" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Savings & Investing", icon: "💰" },
  { name: "Income", icon: "💵" },
  { name: "Other", icon: "📦" },
];

const CATEGORIES = [
  { name: "Rent / Mortgage", group: "Housing", emoji: "🏠", isIncome: false },
  { name: "Utilities", group: "Housing", emoji: "💡", isIncome: false },
  { name: "Groceries", group: "Food & Dining", emoji: "🛒", isIncome: false },
  { name: "Restaurants", group: "Food & Dining", emoji: "🍽️", isIncome: false },
  { name: "Coffee Shops", group: "Food & Dining", emoji: "☕", isIncome: false },
  { name: "Gas", group: "Transportation", emoji: "⛽", isIncome: false },
  { name: "Rideshare", group: "Transportation", emoji: "🚕", isIncome: false },
  { name: "Doctor / Medical", group: "Health", emoji: "🏥", isIncome: false },
  { name: "Gym / Fitness", group: "Health", emoji: "🏋️", isIncome: false },
  { name: "Streaming", group: "Entertainment", emoji: "📺", isIncome: false },
  { name: "Clothing", group: "Shopping", emoji: "👕", isIncome: false },
  { name: "Amazon / Online", group: "Shopping", emoji: "📦", isIncome: false },
  { name: "Savings", group: "Savings & Investing", emoji: "💰", isIncome: false },
  { name: "Salary", group: "Income", emoji: "💵", isIncome: true },
  { name: "Freelance", group: "Income", emoji: "💻", isIncome: true },
  { name: "Uncategorized", group: "Other", emoji: "❓", isIncome: false },
];

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@moneymap.app" },
    update: {},
    create: { name: "Alex Johnson", email: "demo@moneymap.app", passwordHash },
  });
  console.log("✓ Created user:", user.email);

  // Create household
  let household = await prisma.household.findFirst({ where: { members: { some: { userId: user.id } } } });
  if (!household) {
    household = await prisma.household.create({ data: { name: "Johnson Household" } });
    await prisma.householdMember.create({ data: { householdId: household.id, userId: user.id, role: "OWNER", inviteStatus: "ACCEPTED" } });
  }

  // Category groups and categories
  const groupMap: Record<string, string> = {};
  for (const g of CATEGORY_GROUPS) {
    const existing = await prisma.categoryGroup.findFirst({ where: { userId: user.id, name: g.name } });
    const group = existing ?? await prisma.categoryGroup.create({ data: { userId: user.id, name: g.name, icon: g.icon, isSystem: true } });
    groupMap[g.name] = group.id;
  }

  const catMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { userId: user.id, name: c.name } });
    const cat = existing ?? await prisma.category.create({ data: { userId: user.id, groupId: groupMap[c.group], name: c.name, emoji: c.emoji, isSystem: true, isIncome: c.isIncome } });
    catMap[c.name] = cat.id;
  }
  console.log("✓ Categories created");

  // Accounts
  const checking = await prisma.financialAccount.upsert({
    where: { id: "seed-checking" },
    update: {},
    create: { id: "seed-checking", householdId: household.id, name: "Chase Checking", type: "CHECKING", institution: "Chase", balance: 4250.80 },
  });
  const savings = await prisma.financialAccount.upsert({
    where: { id: "seed-savings" },
    update: {},
    create: { id: "seed-savings", householdId: household.id, name: "Ally High-Yield Savings", type: "SAVINGS", institution: "Ally", balance: 12500.00 },
  });
  const cc = await prisma.financialAccount.upsert({
    where: { id: "seed-cc" },
    update: {},
    create: { id: "seed-cc", householdId: household.id, name: "Chase Sapphire", type: "CREDIT_CARD", institution: "Chase", balance: 2340.55, interestRate: 19.99, minimumPayment: 35, creditLimit: 10000 },
  });
  const invest = await prisma.financialAccount.upsert({
    where: { id: "seed-invest" },
    update: {},
    create: { id: "seed-invest", householdId: household.id, name: "Fidelity Brokerage", type: "INVESTMENT", institution: "Fidelity", balance: 38500.00 },
  });
  const retirement = await prisma.financialAccount.upsert({
    where: { id: "seed-retirement" },
    update: {},
    create: { id: "seed-retirement", householdId: household.id, name: "401(k) — Fidelity", type: "RETIREMENT", institution: "Fidelity", balance: 52000.00 },
  });
  const studentLoan = await prisma.financialAccount.upsert({
    where: { id: "seed-loan" },
    update: {},
    create: { id: "seed-loan", householdId: household.id, name: "Student Loan", type: "LOAN", institution: "Navient", balance: 18200.00, interestRate: 5.5, minimumPayment: 220 },
  });
  console.log("✓ Accounts created");

  // Net worth snapshots (last 6 months)
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    await prisma.netWorthSnapshot.create({ data: { accountId: savings.id, balance: 12500 - i * 400, date: d } });
  }

  // Transactions (last 2 months)
  const txnData = [
    { merchant: "Direct Deposit — Acme Corp", amount: 4500, type: "CREDIT", cat: "Salary", dayOffset: 1 },
    { merchant: "Riverside Apartments", amount: 1850, type: "DEBIT", cat: "Rent / Mortgage", dayOffset: 2 },
    { merchant: "Whole Foods Market", amount: 134.52, type: "DEBIT", cat: "Groceries", dayOffset: 3 },
    { merchant: "Netflix", amount: 15.49, type: "DEBIT", cat: "Streaming", dayOffset: 4 },
    { merchant: "Starbucks", amount: 7.25, type: "DEBIT", cat: "Coffee Shops", dayOffset: 5 },
    { merchant: "Uber", amount: 18.40, type: "DEBIT", cat: "Rideshare", dayOffset: 6 },
    { merchant: "Amazon", amount: 67.99, type: "DEBIT", cat: "Amazon / Online", dayOffset: 7 },
    { merchant: "Chipotle", amount: 12.80, type: "DEBIT", cat: "Restaurants", dayOffset: 8 },
    { merchant: "Shell Gas Station", amount: 55.20, type: "DEBIT", cat: "Gas", dayOffset: 9 },
    { merchant: "Planet Fitness", amount: 24.99, type: "DEBIT", cat: "Gym / Fitness", dayOffset: 10 },
    { merchant: "CVS Pharmacy", amount: 28.40, type: "DEBIT", cat: "Doctor / Medical", dayOffset: 11 },
    { merchant: "Trader Joe's", amount: 89.12, type: "DEBIT", cat: "Groceries", dayOffset: 12 },
    { merchant: "Target", amount: 143.67, type: "DEBIT", cat: "Shopping", dayOffset: 13 },
    { merchant: "Spotify", amount: 9.99, type: "DEBIT", cat: "Streaming", dayOffset: 14 },
    { merchant: "PG&E — Electric", amount: 98.45, type: "DEBIT", cat: "Utilities", dayOffset: 15 },
    { merchant: "Freelance Payment", amount: 800, type: "CREDIT", cat: "Freelance", dayOffset: 16 },
    { merchant: "Sweetgreen", amount: 14.50, type: "DEBIT", cat: "Restaurants", dayOffset: 17 },
    { merchant: "Zara", amount: 79.00, type: "DEBIT", cat: "Clothing", dayOffset: 18 },
    { merchant: "DoorDash", amount: 32.80, type: "DEBIT", cat: "Restaurants", dayOffset: 19 },
    { merchant: "Costco", amount: 187.55, type: "DEBIT", cat: "Groceries", dayOffset: 20 },
  ];

  for (let month = 1; month <= 2; month++) {
    for (const t of txnData) {
      const date = new Date(now.getFullYear(), now.getMonth() - (2 - month), t.dayOffset);
      const acct = t.type === "CREDIT" ? checking : (["Streaming"].includes(t.cat) ? cc : checking);
      const existing = await prisma.transaction.findFirst({ where: { householdId: household.id, merchant: t.merchant, amount: t.amount, date: { gte: new Date(date.getFullYear(), date.getMonth(), 1), lt: new Date(date.getFullYear(), date.getMonth() + 1, 1) } } });
      if (!existing) {
        await prisma.transaction.create({
          data: { householdId: household.id, accountId: acct.id, date, merchant: t.merchant, amount: t.amount, type: t.type as "DEBIT" | "CREDIT", categoryId: catMap[t.cat] ?? catMap["Uncategorized"], isReviewed: Math.random() > 0.3 },
        });
      }
    }
  }
  console.log("✓ Transactions created");

  // Budget for current month
  const budget = await prisma.budget.upsert({
    where: { userId_month_year: { userId: user.id, month: now.getMonth() + 1, year: now.getFullYear() } },
    update: {},
    create: { userId: user.id, householdId: household.id, month: now.getMonth() + 1, year: now.getFullYear(), income: 5300, mode: "FLEXIBLE" },
  });

  const budgetCats = [
    { name: "Rent / Mortgage", planned: 1850, isFixed: true },
    { name: "Groceries", planned: 500 },
    { name: "Restaurants", planned: 200 },
    { name: "Utilities", planned: 150, isFixed: true },
    { name: "Streaming", planned: 50 },
    { name: "Gas", planned: 100 },
    { name: "Gym / Fitness", planned: 30, isFixed: true },
    { name: "Savings", planned: 500 },
  ];

  for (const bc of budgetCats) {
    if (catMap[bc.name]) {
      await prisma.budgetCategory.upsert({
        where: { budgetId_categoryId: { budgetId: budget.id, categoryId: catMap[bc.name] } },
        update: {},
        create: { budgetId: budget.id, categoryId: catMap[bc.name], planned: bc.planned, isFixed: bc.isFixed ?? false },
      });
    }
  }
  console.log("✓ Budget created");

  // Goals
  const goalDefs = [
    { name: "Emergency Fund", type: "EMERGENCY_FUND" as const, targetAmount: 15000, currentAmount: 12500, monthlyContrib: 400 },
    { name: "Hawaii Vacation", type: "VACATION" as const, targetAmount: 5000, currentAmount: 1200, monthlyContrib: 200, targetDate: new Date(now.getFullYear(), now.getMonth() + 10, 1) },
    { name: "Home Down Payment", type: "DOWN_PAYMENT" as const, targetAmount: 60000, currentAmount: 8500, monthlyContrib: 500, targetDate: new Date(now.getFullYear() + 4, 0, 1) },
    { name: "Pay Off Student Loan", type: "DEBT_PAYOFF" as const, targetAmount: 18200, currentAmount: 0, monthlyContrib: 300 },
  ];

  for (const g of goalDefs) {
    const existing = await prisma.goal.findFirst({ where: { userId: user.id, name: g.name } });
    if (!existing) await prisma.goal.create({ data: { ...g, userId: user.id, householdId: household.id } });
  }
  console.log("✓ Goals created");

  // Recurring
  const recurringDefs = [
    { merchant: "Riverside Apartments (Rent)", amount: 1850, type: "DEBIT", frequency: "MONTHLY", dayOfMonth: 1, nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), status: "KEEP" },
    { merchant: "Netflix", amount: 15.49, type: "DEBIT", frequency: "MONTHLY", dayOfMonth: 4, nextDueDate: new Date(now.getFullYear(), now.getMonth(), 4 > now.getDate() ? now.getMonth() : now.getMonth() + 1, 4), status: "KEEP" },
    { merchant: "Spotify", amount: 9.99, type: "DEBIT", frequency: "MONTHLY", dayOfMonth: 14, nextDueDate: new Date(now.getFullYear(), now.getMonth() + (14 > now.getDate() ? 0 : 1), 14), status: "KEEP" },
    { merchant: "Planet Fitness", amount: 24.99, type: "DEBIT", frequency: "MONTHLY", dayOfMonth: 10, nextDueDate: new Date(now.getFullYear(), now.getMonth() + (10 > now.getDate() ? 0 : 1), 10), status: "KEEP" },
    { merchant: "Acme Corp — Paycheck", amount: 4500, type: "CREDIT", frequency: "BIWEEKLY", nextDueDate: new Date(now.getFullYear(), now.getMonth(), 15), status: "KEEP" },
  ];

  for (const r of recurringDefs) {
    const existing = await prisma.recurringTransaction.findFirst({ where: { householdId: household.id, merchant: r.merchant } });
    if (!existing) await prisma.recurringTransaction.create({ data: { ...r, householdId: household.id, accountId: checking.id, isManual: true, type: r.type as "DEBIT" | "CREDIT", frequency: r.frequency as any, status: r.status as any } });
  }
  console.log("✓ Recurring transactions created");

  // Investment holdings
  const holdings = [
    { symbol: "VTI", name: "Vanguard Total Stock ETF", quantity: 85, costBasis: 200, currentPrice: 245.30, assetClass: "ETF" },
    { symbol: "VXUS", name: "Vanguard Total Intl ETF", quantity: 50, costBasis: 55, currentPrice: 62.15, assetClass: "ETF" },
    { symbol: "BND", name: "Vanguard Bond ETF", quantity: 30, costBasis: 78, currentPrice: 73.40, assetClass: "BOND" },
    { symbol: "AAPL", name: "Apple Inc.", quantity: 10, costBasis: 145, currentPrice: 187.50, assetClass: "STOCK" },
  ];

  for (const h of holdings) {
    const existing = await prisma.investmentHolding.findFirst({ where: { accountId: invest.id, symbol: h.symbol } });
    if (!existing) await prisma.investmentHolding.create({ data: { ...h, accountId: invest.id, assetClass: h.assetClass as any } });
  }
  console.log("✓ Investment holdings created");

  // Debt
  const debtDefs = [
    { name: "Chase Sapphire Credit Card", type: "CREDIT_CARD", balance: 2340.55, originalBalance: 3200, interestRate: 19.99, minimumPayment: 35, payoffStrategy: "AVALANCHE" },
    { name: "Federal Student Loans", type: "STUDENT_LOAN", balance: 18200, originalBalance: 28000, interestRate: 5.5, minimumPayment: 220, payoffStrategy: "AVALANCHE" },
  ];

  for (const d of debtDefs) {
    const existing = await prisma.debt.findFirst({ where: { userId: user.id, name: d.name } });
    if (!existing) await prisma.debt.create({ data: { ...d, userId: user.id, householdId: household.id, type: d.type as any, payoffStrategy: d.payoffStrategy as any } });
  }
  console.log("✓ Debts created");

  console.log("\n✅ Seed complete!");
  console.log("📧 Demo login: demo@moneymap.app / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
