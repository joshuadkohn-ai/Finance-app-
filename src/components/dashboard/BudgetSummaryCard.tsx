import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import Bar from "@/components/ui/Bar";
import type { BudgetCategoryRow } from "@/types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

interface Props {
  budget: BudgetCategoryRow[];
  monthName: string;
}

export default function BudgetSummaryCard({ budget, monthName }: Props) {
  const budTotal = budget.reduce((x, b) => x + b.amt, 0);
  const spentTotal = budget.reduce((x, b) => x + b.spent, 0);
  const top4 = [...budget]
    .sort((a, b) => b.spent / b.amt - a.spent / a.amt)
    .slice(0, 4);

  return (
    <CCard
      title={`${monthName} budget`}
      right={`${fmt(spentTotal)} of ${fmt(budTotal)}`}
    >
      <Bar
        pct={(spentTotal / budTotal) * 100}
        color={spentTotal > budTotal ? C.red : C.em}
      />
      <div style={{ fontSize: 13, color: C.mut, margin: "8px 0 14px" }}>
        {fmt(Math.max(0, budTotal - spentTotal))} left to spend this month
      </div>
      {top4.map((b) => (
        <div
          key={b.slug}
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            padding: "5px 0",
            color: C.mut,
          }}
        >
          <span>{b.name}</span>
          <span
            style={{
              color: b.spent > b.amt ? C.red : C.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmt(b.spent)} / {fmt(b.amt)}
          </span>
        </div>
      ))}
    </CCard>
  );
}
