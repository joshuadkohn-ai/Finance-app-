import { C, GCOL } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import Bar from "@/components/ui/Bar";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();
const fmt2 = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface Props {
  cash: number;
  invest: number;
  retire: number;
  nw: number;
  principal: number;
  growth: number;
  investTotal: number;
}

export default function BreakdownCard({
  cash,
  invest,
  retire,
  nw,
  principal,
  growth,
  investTotal,
}: Props) {
  return (
    <CCard title="Breakdown">
      {(
        [
          ["Cash", cash],
          ["Investments", invest],
          ["Retirement", retire],
        ] as [string, number][]
      ).map(([g, v]) => (
        <div key={g} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
              marginBottom: 5,
            }}
          >
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: GCOL[g],
                  marginRight: 8,
                }}
              />
              {g}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt2(v)}</span>
          </div>
          <Bar pct={(v / nw) * 100} color={GCOL[g]} />
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: C.mut,
          marginTop: 14,
        }}
      >
        <span>Principal {fmt(principal)}</span>
        <span style={{ color: growth >= 0 ? C.em : C.red }}>
          Growth {fmt(growth)} (
          {investTotal > 0 ? ((growth / investTotal) * 100).toFixed(1) : 0}%)
        </span>
      </div>
    </CCard>
  );
}
