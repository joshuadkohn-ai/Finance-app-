import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import Bar from "@/components/ui/Bar";
import type { MilestoneData } from "@/lib/engine";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

interface Props {
  milestones: MilestoneData[];
  ret: number;
  monthly: number;
}

export default function MilestoneCard({ milestones, ret, monthly }: Props) {
  return (
    <CCard
      title="Millionaire tracker"
      right={`${ret}% return · $${Math.round(monthly).toLocaleString()}/mo`}
    >
      {milestones.map((m) => (
        <div key={m.t} style={{ marginBottom: 13 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <span>{fmt(m.t)}</span>
            <span style={{ color: C.mut }}>
              {m.pct.toFixed(0)}%
              {m.m === 0
                ? " · reached"
                : m.d
                ? ` · ~${m.d.toLocaleDateString(undefined, { month: "short", year: "numeric" })} (${(m.m! / 12).toFixed(1)} yr)`
                : ""}
            </span>
          </div>
          <Bar pct={m.pct} color={m.t >= 1_000_000 ? C.gold : C.em} />
        </div>
      ))}
    </CCard>
  );
}
