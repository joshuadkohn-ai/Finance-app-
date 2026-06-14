import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import Bar from "@/components/ui/Bar";
import type { MilestoneData } from "@/lib/engine";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

interface Props {
  rothYTD: { josh: number; elana: number };
  rothLimit: number;
  contributed: number;
  nextMilestone: MilestoneData | null;
}

export default function RothProgressCard({
  rothYTD,
  rothLimit,
  contributed,
  nextMilestone,
}: Props) {
  return (
    <CCard title="Roth IRA progress this year">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {(
          [
            ["Josh", rothYTD.josh],
            ["Elana", rothYTD.elana],
          ] as [string, number][]
        ).map(([l, v]) => (
          <div key={l}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 5,
              }}
            >
              <span>{l}</span>
              <span style={{ color: C.mut }}>
                {fmt(v)} / {fmt(rothLimit)} · {fmt(Math.max(0, rothLimit - v))}{" "}
                to go
              </span>
            </div>
            <Bar pct={(v / rothLimit) * 100} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: C.mut, marginTop: 16 }}>
        Invested since tracking began:{" "}
        <b style={{ color: C.text }}>{fmt(contributed)}</b>
        {nextMilestone && nextMilestone.d && (
          <>
            {" "}
            · Next milestone:{" "}
            <b style={{ color: C.gold }}>{fmt(nextMilestone.t)}</b> around{" "}
            {nextMilestone.d.toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </>
        )}
      </div>
    </CCard>
  );
}
