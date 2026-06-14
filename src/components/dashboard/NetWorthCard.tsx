"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import type { SnapPoint } from "@/types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();
const fmt2 = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const chartTip = {
  contentStyle: {
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
  },
  formatter: (v: unknown) => fmt(Number(v)),
};

interface Props {
  nw: number;
  firstNW: number;
  snaps: SnapPoint[];
}

export default function NetWorthCard({ nw, firstNW, snaps }: Props) {
  const diff = nw - firstNW;
  const chartData = snaps.map((h) => ({
    ...h,
    d: new Date(h.t).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <CCard>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: C.mut,
        }}
      >
        Net worth
      </div>
      <div
        style={{
          fontFamily: "Fraunces, serif",
          fontSize: 38,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt2(nw)}
      </div>
      <div style={{ fontSize: 13, marginTop: 4 }}>
        <span style={{ color: diff >= 0 ? C.em : C.red }}>
          {diff >= 0 ? "▲" : "▼"} {fmt(Math.abs(diff))}
        </span>
        <span style={{ color: C.mut }}> since tracking began</span>
      </div>
      {snaps.length > 1 && (
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData} margin={{ top: 14 }}>
            <XAxis dataKey="d" stroke={C.mut} fontSize={11} />
            <YAxis hide domain={["dataMin - 2000", "dataMax + 2000"]} />
            <Tooltip {...chartTip} />
            <Line
              dataKey="nw"
              name="Net worth"
              stroke={C.em}
              dot={false}
              strokeWidth={2.5}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </CCard>
  );
}
