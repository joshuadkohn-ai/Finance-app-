"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import { projAtYears } from "@/lib/engine";
import type { ProjChartPoint } from "@/lib/engine";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

const chartTip = {
  contentStyle: {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
  },
  formatter: (v: unknown) => fmt(Number(v)),
  labelFormatter: (l: unknown) => `Age ${l}`,
};

interface Props {
  projChart: ProjChartPoint[];
  nw: number;
  principal: number;
  settings: {
    ret: number;
    monthly: number;
    age: number;
    retireAge: number;
    inflation: number;
  };
}

export default function ProjectionCard({ projChart, nw, principal, settings }: Props) {
  const ages = [25, 30, 35, 40, 50, 60].filter((x) => x >= settings.age);

  const retireProj = projAtYears(
    settings.retireAge - settings.age,
    nw,
    principal,
    settings
  );
  const inflationAdjusted =
    retireProj.v /
    Math.pow(1 + settings.inflation / 100, settings.retireAge - settings.age);

  return (
    <CCard
      title={`Projection to age ${settings.retireAge}`}
      right={`${settings.ret}% return · $${Math.round(settings.monthly).toLocaleString()}/mo`}
      style={{ marginTop: 14 }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={projChart}>
          <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
          <XAxis dataKey="age" stroke={C.mut} fontSize={11} />
          <YAxis
            stroke={C.mut}
            fontSize={11}
            tickFormatter={(v) => "$" + (v / 1_000_000).toFixed(1) + "M"}
            width={52}
          />
          <Tooltip {...chartTip} />
          <Line
            dataKey="total"
            name="Total"
            stroke={C.em}
            dot={false}
            strokeWidth={2}
          />
          <Line
            dataKey="principal"
            name="Principal"
            stroke={C.gold}
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          marginTop: 10,
        }}
      >
        <thead>
          <tr style={{ color: C.mut, textAlign: "right" }}>
            <th style={{ textAlign: "left", padding: 6 }}>Age</th>
            <th style={{ padding: 6 }}>Principal</th>
            <th style={{ padding: 6 }}>Growth</th>
            <th style={{ padding: 6 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {ages.map((age) => {
            const { v, p } = projAtYears(
              age - settings.age,
              nw,
              principal,
              settings
            );
            return (
              <tr
                key={age}
                style={{
                  borderTop: `1px solid ${C.line}`,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <td style={{ textAlign: "left", padding: 6 }}>{age}</td>
                <td style={{ padding: 6 }}>{fmt(p)}</td>
                <td style={{ padding: 6, color: C.em }}>{fmt(v - p)}</td>
                <td style={{ padding: 6, fontWeight: 600 }}>{fmt(v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ fontSize: 12, color: C.mut, marginTop: 10 }}>
        In today&apos;s dollars at {settings.inflation}% inflation, the age-
        {settings.retireAge} total ≈ {fmt(inflationAdjusted)}. Projections are
        estimates, not guarantees.
      </div>
    </CCard>
  );
}
