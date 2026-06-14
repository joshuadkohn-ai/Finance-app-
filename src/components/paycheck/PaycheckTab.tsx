"use client";

import { useState, useTransition } from "react";
import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import { buildPlan, buildSteps, getRothRooms, DEST_NAMES } from "@/lib/engine";
import { applyPaycheckPlan } from "@/app/actions";
import type { Plan } from "@/lib/engine";
import type { LogEntry } from "@/types";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();
const fmt2 = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const r2 = (v: number) => Math.round(v * 100) / 100;

interface Props {
  budTotal: number;
  rothYTD: { josh: number; elana: number };
  rothLimit: number;
  efBal: number;
  efTarget: number;
  voo: number;
  qqqm: number;
  stk: number;
  log: LogEntry[];
}

export default function PaycheckTab({
  budTotal,
  rothYTD,
  rothLimit,
  efBal,
  efTarget,
  voo,
  qqqm,
  stk,
  log,
}: Props) {
  const [pay, setPay] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [, startTransition] = useTransition();

  const perPay = budTotal / 2;
  const { jRoom, eRoom } = getRothRooms(rothYTD, rothLimit);
  const efGap = Math.max(0, efTarget - efBal);

  const allocate = () => {
    const v = parseFloat(pay);
    if (v > 0)
      setPlan(buildPlan(v, { rothYTD, rothLimit, budTotal }));
  };

  const setAlloc = (k: keyof Plan["alloc"], v: number) =>
    setPlan((pp) =>
      pp ? { ...pp, alloc: { ...pp.alloc, [k]: Math.max(0, v) } } : pp
    );

  const applyDisabled = (() => {
    if (!plan) return true;
    const al = plan.alloc;
    const allocated = al.jr + al.er + al.tb + al.sv + al.cr + al.jc;
    const un = r2(plan.amt - plan.toExp - allocated);
    if (Math.abs(un) >= 0.01) return true;
    if (al.jr > jRoom + 0.01 || al.er > eRoom + 0.01) return true;
    return false;
  })();

  const handleApply = () => {
    if (!plan || applyDisabled) return;
    const steps = buildSteps(plan);
    startTransition(async () => {
      await applyPaycheckPlan(plan.amt, plan.toExp, plan.alloc, steps);
      setPlan(null);
      setPay("");
    });
  };

  const ROWS: [keyof Plan["alloc"], string, string][] = [
    ["jr", DEST_NAMES.jr, `${fmt(jRoom)} room this year`],
    ["er", DEST_NAMES.er, `${fmt(eRoom)} room this year`],
    ["tb", DEST_NAMES.tb, `invest as ${voo}/${qqqm}/${stk} VOO/QQQM/stocks`],
    ["sv", DEST_NAMES.sv, efGap > 0 ? `${fmt(efGap)} below target` : "at target"],
    ["cr", DEST_NAMES.cr, ""],
    ["jc", DEST_NAMES.jc, "extra spending money"],
  ];

  const unplaced = plan
    ? r2(plan.amt - plan.toExp - Object.values(plan.alloc).reduce((s, v) => s + v, 0))
    : 0;
  const overRoth = plan
    ? plan.alloc.jr > jRoom + 0.01 || plan.alloc.er > eRoom + 0.01
    : false;
  const ok = !overRoth && Math.abs(unplaced) < 0.01;

  return (
    <>
      <CCard title="Paycheck received">
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="number"
            placeholder="2500"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && allocate()}
            style={{
              flex: 1,
              minWidth: 0,
              background: C.bg,
              color: C.text,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 18,
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <button
            onClick={allocate}
            style={{
              background: C.em,
              color: "#06281C",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Allocate
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            fontSize: 12,
            color: C.mut,
            flexWrap: "wrap",
          }}
        >
          <span>
            Set-aside/paycheck:{" "}
            <b style={{ color: C.text }}>{fmt(perPay)}</b>
          </span>
          <span>
            Josh Roth room:{" "}
            <b style={{ color: C.text }}>{fmt(jRoom)}</b>
          </span>
          <span>
            Elana Roth room:{" "}
            <b style={{ color: C.text }}>{fmt(eRoom)}</b>
          </span>
          {efGap > 0 && (
            <span>
              EF gap: <b style={{ color: C.gold }}>{fmt(efGap)}</b>
            </span>
          )}
        </div>
      </CCard>

      {plan && (
        <CCard
          title={`Allocate ${fmt2(plan.amt)}`}
          style={{ marginTop: 14, borderColor: C.em }}
        >
          {/* Expense set-aside row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <div>
              <div style={{ fontSize: 14 }}>Expense set-aside → checking</div>
              <div style={{ fontSize: 11, color: C.mut }}>
                bills first — half of {fmt(budTotal)}/mo budget
              </div>
            </div>
            <div
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 17,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt2(plan.toExp)}
            </div>
          </div>

          <div style={{ fontSize: 12, color: C.mut, padding: "10px 0 4px" }}>
            You decide the rest — {fmt2(plan.amt - plan.toExp)} to place:
          </div>

          {ROWS.map(([k, label, sub]) => {
            const over =
              (k === "jr" && plan.alloc.jr > jRoom + 0.01) ||
              (k === "er" && plan.alloc.er > eRoom + 0.01);
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 14 }}>{label}</div>
                  {sub && (
                    <div style={{ fontSize: 11, color: C.mut }}>{sub}</div>
                  )}
                </div>
                <input
                  type="number"
                  value={plan.alloc[k]}
                  onChange={(e) =>
                    setAlloc(k, parseFloat(e.target.value) || 0)
                  }
                  style={{
                    width: 110,
                    textAlign: "right",
                    background: C.bg,
                    color: over ? C.red : C.em,
                    border: `1px solid ${C.line}`,
                    borderRadius: 8,
                    padding: "7px 9px",
                    fontSize: 15,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </div>
            );
          })}

          <div
            style={{
              fontSize: 13,
              marginTop: 12,
              color: ok ? C.em : unplaced > 0 ? C.gold : C.red,
            }}
          >
            {overRoth
              ? "Roth amount exceeds remaining contribution room"
              : Math.abs(unplaced) < 0.01
              ? "Every dollar has a job ✓"
              : unplaced > 0
              ? `${fmt2(unplaced)} still to place`
              : `Over-allocated by ${fmt2(-unplaced)}`}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              disabled={applyDisabled}
              onClick={handleApply}
              style={{
                background: applyDisabled ? C.line : C.em,
                color: applyDisabled ? C.mut : "#06281C",
                border: "none",
                borderRadius: 10,
                padding: "11px 18px",
                fontWeight: 700,
                cursor: applyDisabled ? "default" : "pointer",
              }}
            >
              Apply to balances
            </button>
            <button
              onClick={() =>
                setPlan(buildPlan(plan.amt, { rothYTD, rothLimit, budTotal }))
              }
              style={{
                background: "transparent",
                color: C.text,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "11px 18px",
                cursor: "pointer",
              }}
            >
              Use suggestion
            </button>
            <button
              onClick={() => setPlan(null)}
              style={{
                background: "transparent",
                color: C.mut,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "11px 18px",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </CCard>
      )}

      {log.length > 0 && (
        <CCard title="Allocation history" style={{ marginTop: 14 }}>
          {log.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "8px 0",
                borderBottom: `1px solid ${C.line}`,
                fontSize: 13,
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <b>{fmt2(e.amt)}</b>
                <span style={{ color: C.mut }}>
                  {new Date(e.t).toLocaleDateString()}
                </span>
              </div>
              <div style={{ color: C.mut, fontSize: 12 }}>
                {e.steps
                  .map((x) => `${x.k} ${fmt(x.v)}`)
                  .join(" · ")}
              </div>
            </div>
          ))}
        </CCard>
      )}
    </>
  );
}
