import { getFullState } from "@/lib/db";
import { updateBudgetAmt, updateBudgetSpent } from "@/app/actions";
import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import Bar from "@/components/ui/Bar";
import EditNum from "@/components/ui/EditNum";

export const dynamic = "force-dynamic";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

export default async function BudgetPage() {
  const { budget } = await getFullState();

  const budTotal = budget.reduce((s, b) => s + b.amt, 0);
  const spentTotal = budget.reduce((s, b) => s + b.spent, 0);
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const perPay = budTotal / 2;

  return (
    <CCard
      title={`${monthName} budget`}
      right={`${fmt(Math.max(0, budTotal - spentTotal))} left`}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: C.mut,
          marginBottom: 6,
        }}
      >
        <span>Spent {fmt(spentTotal)}</span>
        <span>Budgeted {fmt(budTotal)}</span>
      </div>
      <Bar
        pct={budTotal > 0 ? (spentTotal / budTotal) * 100 : 0}
        color={spentTotal > budTotal ? C.red : C.em}
      />
      <div style={{ marginTop: 18 }}>
        {budget.map((b) => (
          <div
            key={b.slug}
            style={{ padding: "11px 0", borderBottom: `1px solid ${C.line}` }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{b.name}</span>
              <span style={{ fontSize: 13, color: C.mut }}>
                <EditNum
                  val={b.spent}
                  onSave={updateBudgetSpent.bind(null, b.slug)}
                  color={b.spent > b.amt ? C.red : C.text}
                />{" "}
                of{" "}
                <EditNum
                  val={b.amt}
                  onSave={updateBudgetAmt.bind(null, b.slug)}
                  color={C.mut}
                />
              </span>
            </div>
            <Bar
              pct={b.amt > 0 ? (b.spent / b.amt) * 100 : 0}
              color={b.spent > b.amt ? C.red : C.em}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.mut, marginTop: 12 }}>
        Tap any number to edit. Spending resets automatically on the 1st of each
        month. Each paycheck sets aside {fmt(perPay)} to cover this budget.
      </div>
    </CCard>
  );
}
