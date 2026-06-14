"use client";

import { useState, useTransition } from "react";
import { C } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import NumInput from "@/components/ui/NumInput";
import { updateSettings, updateRothYTD, resetAllData } from "@/app/actions";
import type { SettingsRow } from "@/types";

interface Props {
  settings: SettingsRow;
  rothYTD: { josh: number; elana: number };
}

export default function SettingsCards({ settings: init, rothYTD: initRoth }: Props) {
  const [s, setS] = useState(init);
  const [roth, setRoth] = useState(initRoth);
  const [, startTransition] = useTransition();

  const save = (updates: Partial<typeof s>) => {
    setS((prev) => ({ ...prev, ...updates }));
    startTransition(async () => {
      await updateSettings(updates);
    });
  };

  const saveRoth = (updates: Partial<typeof roth>) => {
    const merged = { ...roth, ...updates };
    setRoth(merged);
    startTransition(async () => {
      await updateRothYTD(merged.josh, merged.elana);
    });
  };

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Reset all data to starting values?")
    ) {
      startTransition(async () => {
        await resetAllData();
      });
    }
  };

  const splitSum = s.voo + s.qqqm + s.stk;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
        gap: 14,
      }}
    >
      <CCard title="Strategy">
        <NumInput
          label="Emergency fund target"
          val={s.efTarget}
          onSave={(v) => save({ efTarget: v })}
        />
        <NumInput
          label="Roth IRA annual limit (per person)"
          val={s.rothLimit}
          onSave={(v) => save({ rothLimit: v })}
        />
        <NumInput
          label="Josh Roth contributed this year"
          val={roth.josh}
          onSave={(v) => saveRoth({ josh: v })}
        />
        <NumInput
          label="Elana Roth contributed this year"
          val={roth.elana}
          onSave={(v) => saveRoth({ elana: v })}
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
        >
          <NumInput
            label="VOO %"
            val={s.voo}
            onSave={(v) => save({ voo: Math.round(v) })}
            step={1}
          />
          <NumInput
            label="QQQM %"
            val={s.qqqm}
            onSave={(v) => save({ qqqm: Math.round(v) })}
            step={1}
          />
          <NumInput
            label="Stocks %"
            val={s.stk}
            onSave={(v) => save({ stk: Math.round(v) })}
            step={1}
          />
        </div>
        {splitSum !== 100 && (
          <div style={{ color: C.red, fontSize: 12 }}>
            Allocation sums to {splitSum}% — adjust to 100%.
          </div>
        )}
      </CCard>

      <CCard title="Assumptions">
        <NumInput
          label="Expected annual return %"
          val={s.ret}
          onSave={(v) => save({ ret: v })}
        />
        <NumInput
          label="Inflation %"
          val={s.inflation}
          onSave={(v) => save({ inflation: v })}
        />
        <NumInput
          label="Monthly contribution (projections)"
          val={s.monthly}
          onSave={(v) => save({ monthly: v })}
        />
        <NumInput
          label="Current age"
          val={s.age}
          onSave={(v) => save({ age: Math.round(v) })}
          step={1}
        />
        <NumInput
          label="Retirement age"
          val={s.retireAge}
          onSave={(v) => save({ retireAge: Math.round(v) })}
          step={1}
        />
        <button
          onClick={handleReset}
          style={{
            background: "transparent",
            color: C.red,
            border: `1px solid ${C.red}`,
            borderRadius: 8,
            padding: "9px 14px",
            cursor: "pointer",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Reset all data
        </button>
      </CCard>
    </div>
  );
}
