import { getFullState } from "@/lib/db";
import { computeMilestones } from "@/lib/engine";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import BreakdownCard from "@/components/dashboard/BreakdownCard";
import BudgetSummaryCard from "@/components/dashboard/BudgetSummaryCard";
import MilestoneCard from "@/components/dashboard/MilestoneCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { accounts, budget, snaps, settings, appState } = await getFullState();

  const groupSum = (g: string) =>
    accounts.filter((a) => a.group === g).reduce((s, a) => s + a.bal, 0);
  const cash = groupSum("Cash");
  const invest = groupSum("Investments");
  const retire = groupSum("Retirement");
  const nw = cash + invest + retire;
  const investTotal = invest + retire;
  const principal = appState.resolvedBasePrincipal + appState.contributed;
  const growth = investTotal - principal;
  const firstNW = snaps[0]?.nw ?? nw;

  const milestones = computeMilestones(nw, settings);
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <NetWorthCard nw={nw} firstNW={firstNW} snaps={snaps} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px,1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        <BreakdownCard
          cash={cash}
          invest={invest}
          retire={retire}
          nw={nw}
          principal={principal}
          growth={growth}
          investTotal={investTotal}
        />
        <BudgetSummaryCard budget={budget} monthName={monthName} />
      </div>

      <div style={{ marginTop: 14 }}>
        <MilestoneCard
          milestones={milestones}
          ret={settings.ret}
          monthly={settings.monthly}
        />
      </div>
    </div>
  );
}
