import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  "";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const joshPw = process.env.JOSH_PASSWORD ?? "changeme";
  const elanaPw = process.env.ELANA_PASSWORD ?? "changeme";

  await prisma.user.upsert({
    where: { email: "josh@household.local" },
    update: {},
    create: {
      email: "josh@household.local",
      name: "Josh",
      passwordHash: await bcrypt.hash(joshPw, 12),
    },
  });

  await prisma.user.upsert({
    where: { email: "elana@household.local" },
    update: {},
    create: {
      email: "elana@household.local",
      name: "Elana",
      passwordHash: await bcrypt.hash(elanaPw, 12),
    },
  });

  const accounts = [
    { slug: "jc", name: "Josh checking", group: "Cash", bal: 1000 },
    { slug: "ec", name: "Elana checking", group: "Cash", bal: 3500 },
    { slug: "sv", name: "Savings · emergency fund", group: "Cash", bal: 9064.12 },
    { slug: "cr", name: "Cash reserve", group: "Cash", bal: 26000 },
    { slug: "tb", name: "Joint taxable brokerage", group: "Investments", bal: 20380.23 },
    { slug: "eb", name: "Elana's brokerage", group: "Investments", bal: 31000 },
    { slug: "jr", name: "Josh Roth IRA", group: "Retirement", bal: 7360 },
    { slug: "er", name: "Elana Roth IRA", group: "Retirement", bal: 8000 },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({ where: { slug: acc.slug }, update: {}, create: acc });
  }

  const budget = [
    { slug: "rent", name: "Rent", amt: 2475 },
    { slug: "util", name: "Electric / Gas", amt: 125 },
    { slug: "net", name: "Internet", amt: 63 },
    { slug: "car", name: "Car insurance", amt: 200 },
    { slug: "gas", name: "Gas", amt: 150 },
    { slug: "groc", name: "Groceries", amt: 600 },
    { slug: "house", name: "Household items", amt: 75 },
    { slug: "sub", name: "Subscriptions", amt: 35 },
    { slug: "dine", name: "Dining out", amt: 225 },
    { slug: "misc", name: "Miscellaneous", amt: 300 },
  ];

  for (const cat of budget) {
    await prisma.budgetCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, spent: 0 },
    });
  }

  await prisma.appState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  console.log("Seeded: Josh, Elana, 8 accounts, 10 budget categories, settings");
  console.log("Login: josh@household.local / <JOSH_PASSWORD env>");
  console.log("Login: elana@household.local / <ELANA_PASSWORD env>");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
