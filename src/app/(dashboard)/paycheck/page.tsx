import { getFullState } from "@/lib/db";
import PaycheckTab from "@/components/paycheck/PaycheckTab";

export const dynamic = "force-dynamic";

export default async function PaycheckPage() {
  const { budget, accounts, appState, settings, log } = await getFullState();

  const budTotal = budget.reduce((s, b) => s + b.amt, 0);
  const efBal = accounts.find((a) => a.slug === "sv")?.bal ?? 0;

  return (
    <PaycheckTab
      budTotal={budTotal}
      rothYTD={{ josh: appState.rothYTDJosh, elana: appState.rothYTDElana }}
      rothLimit={settings.rothLimit}
      efBal={efBal}
      efTarget={settings.efTarget}
      voo={settings.voo}
      qqqm={settings.qqqm}
      stk={settings.stk}
      log={log}
    />
  );
}
