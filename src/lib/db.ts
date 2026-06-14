import { prisma } from "./prisma";
import type { FullState, StepItem } from "@/types";

export async function getFullState(): Promise<FullState> {
  const m = new Date().toISOString().slice(0, 7);

  const [appState, settings] = await Promise.all([
    prisma.appState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
  ]);

  let [accounts, budget, snaps, log] = await Promise.all([
    prisma.account.findMany(),
    prisma.budgetCategory.findMany(),
    prisma.netWorthSnapshot.findMany({ orderBy: { t: "asc" }, take: 365 }),
    prisma.allocationLog.findMany({ orderBy: { t: "desc" }, take: 30 }),
  ]);

  // Monthly budget reset
  if (appState.currentMonth !== m) {
    await Promise.all([
      prisma.budgetCategory.updateMany({ data: { spent: 0 } }),
      prisma.appState.update({ where: { id: 1 }, data: { currentMonth: m } }),
    ]);
    budget = budget.map((b) => ({ ...b, spent: 0 }));
  }

  // Derived principal
  const contributed = appState.contributed;
  const invested = accounts
    .filter((a) => a.group !== "Cash")
    .reduce((s, a) => s + a.bal, 0);
  const resolvedBasePrincipal =
    appState.basePrincipal ?? invested - contributed;
  const principal = resolvedBasePrincipal + contributed;
  const nw = accounts.reduce((s, a) => s + a.bal, 0);

  // Daily net worth snapshot
  const today = new Date().toDateString();
  const last = snaps[snaps.length - 1];
  if (!last || new Date(Number(last.t)).toDateString() !== today) {
    const snap = await prisma.netWorthSnapshot.create({
      data: { t: BigInt(Date.now()), nw, principal },
    });
    snaps.push(snap);
  }

  return {
    appState: { ...appState, resolvedBasePrincipal },
    settings,
    accounts,
    budget,
    snaps: snaps.map((s) => ({ t: Number(s.t), nw: s.nw, principal: s.principal })),
    log: log.map((l) => ({
      id: l.id,
      t: Number(l.t),
      amt: l.amt,
      steps: l.steps as unknown as StepItem[],
    })),
  };
}
