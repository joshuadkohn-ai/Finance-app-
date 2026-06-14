"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { StepItem } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function updateAccountBal(slug: string, bal: number) {
  await requireAuth();
  if (!Number.isFinite(bal)) return;
  await prisma.account.update({ where: { slug }, data: { bal } });
  revalidatePath("/", "layout");
}

export async function updateBudgetAmt(slug: string, amt: number) {
  await requireAuth();
  if (!Number.isFinite(amt) || amt < 0) return;
  await prisma.budgetCategory.update({ where: { slug }, data: { amt } });
  revalidatePath("/", "layout");
}

export async function updateBudgetSpent(slug: string, spent: number) {
  await requireAuth();
  if (!Number.isFinite(spent) || spent < 0) return;
  await prisma.budgetCategory.update({ where: { slug }, data: { spent } });
  revalidatePath("/", "layout");
}

export async function updateSettings(data: {
  efTarget?: number;
  rothLimit?: number;
  voo?: number;
  qqqm?: number;
  stk?: number;
  ret?: number;
  inflation?: number;
  age?: number;
  retireAge?: number;
  monthly?: number;
}) {
  await requireAuth();
  await prisma.settings.update({ where: { id: 1 }, data });
  revalidatePath("/", "layout");
}

export async function updateRothYTD(josh: number, elana: number) {
  await requireAuth();
  await prisma.appState.update({
    where: { id: 1 },
    data: { rothYTDJosh: josh, rothYTDElana: elana },
  });
  revalidatePath("/", "layout");
}

export async function applyPaycheckPlan(
  amt: number,
  toExp: number,
  alloc: { jr: number; er: number; tb: number; sv: number; cr: number; jc: number },
  steps: StepItem[]
) {
  await requireAuth();

  const adds: Record<string, number> = {
    jc: toExp / 2 + alloc.jc,
    ec: toExp / 2,
    jr: alloc.jr,
    er: alloc.er,
    tb: alloc.tb,
    sv: alloc.sv,
    cr: alloc.cr,
  };

  const [accounts, appState] = await Promise.all([
    prisma.account.findMany(),
    prisma.appState.findUniqueOrThrow({ where: { id: 1 } }),
  ]);

  const newNW = accounts.reduce((s, a) => s + a.bal + (adds[a.slug] ?? 0), 0);
  const newContributed = appState.contributed + alloc.jr + alloc.er + alloc.tb;
  const invested = accounts
    .filter((a) => a.group !== "Cash")
    .reduce((s, a) => s + a.bal, 0);
  const basePrincipal = appState.basePrincipal ?? invested - appState.contributed;
  const newPrincipal = basePrincipal + newContributed;

  await Promise.all([
    ...accounts
      .filter((a) => adds[a.slug] && adds[a.slug] !== 0)
      .map((a) =>
        prisma.account.update({
          where: { slug: a.slug },
          data: { bal: a.bal + (adds[a.slug] ?? 0) },
        })
      ),
    prisma.appState.update({
      where: { id: 1 },
      data: {
        contributed: newContributed,
        basePrincipal: basePrincipal,
        rothYTDJosh: appState.rothYTDJosh + alloc.jr,
        rothYTDElana: appState.rothYTDElana + alloc.er,
      },
    }),
    prisma.netWorthSnapshot.create({
      data: { t: BigInt(Date.now()), nw: newNW, principal: newPrincipal },
    }),
    prisma.allocationLog.create({
      data: { t: BigInt(Date.now()), amt, steps: steps as unknown as import("@prisma/client").Prisma.InputJsonValue },
    }),
  ]);

  revalidatePath("/", "layout");
}

export async function resetAllData() {
  await requireAuth();

  const defaults = [
    { slug: "jc", bal: 1000 },
    { slug: "ec", bal: 3500 },
    { slug: "sv", bal: 9064.12 },
    { slug: "cr", bal: 26000 },
    { slug: "tb", bal: 20380.23 },
    { slug: "eb", bal: 31000 },
    { slug: "jr", bal: 7360 },
    { slug: "er", bal: 8000 },
  ];

  await Promise.all([
    ...defaults.map((a) =>
      prisma.account.update({ where: { slug: a.slug }, data: { bal: a.bal } })
    ),
    prisma.budgetCategory.updateMany({ data: { spent: 0 } }),
    prisma.appState.update({
      where: { id: 1 },
      data: {
        contributed: 0,
        basePrincipal: null,
        rothYTDJosh: 0,
        rothYTDElana: 0,
        currentMonth: "",
      },
    }),
    prisma.settings.update({
      where: { id: 1 },
      data: {
        efTarget: 10000,
        rothLimit: 7500,
        voo: 60,
        qqqm: 25,
        stk: 15,
        ret: 9,
        inflation: 3,
        age: 25,
        retireAge: 60,
        monthly: 3000,
      },
    }),
    prisma.netWorthSnapshot.deleteMany(),
    prisma.allocationLog.deleteMany(),
  ]);

  revalidatePath("/", "layout");
}
