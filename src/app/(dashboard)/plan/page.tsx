import { getFullState } from "@/lib/db";
import { computeMilestones, buildProjChart } from "@/lib/engine";
import RothProgressCard from "@/components/plan/RothProgressCard";
import ProjectionCard from "@/components/plan/ProjectionCard";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const { appState, settings, accounts } = await getFullState();

  const investTotal = accounts
    .filter((a) => a.group !== "Cash")
    .reduce((s, a) => s + a.bal, 0);
  const cash = accounts
    .filter((a) => a.group === "Cash")
    .reduce((s, a) => s + a.bal, 0);
  const nw = cash + investTotal;
  const principal = appState.resolvedBasePrincipal + appState.contributed;

  const milestones = computeMilestones(nw, settings);
  const nextMilestone = milestones.find((m) => m.m && m.d) ?? null;

  const projChart = buildProjChart(nw, principal, settings);

  return (
    <>
      <RothProgressCard
        rothYTD={{ josh: appState.rothYTDJosh, elana: appState.rothYTDElana }}
        rothLimit={settings.rothLimit}
        contributed={appState.contributed}
        nextMilestone={nextMilestone}
      />
      <ProjectionCard
        projChart={projChart}
        nw={nw}
        principal={principal}
        settings={settings}
      />
    </>
  );
}
