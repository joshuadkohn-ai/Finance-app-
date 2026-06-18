"use client";

import { useState } from "react";
import { C } from "@/lib/colors";

interface NumInputProps {
  label: string;
  val: number;
  onSave: (v: number) => void;
  step?: number;
}

export default function NumInput({ label, val, onSave, step }: NumInputProps) {
  const [local, setLocal] = useState(val);

  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.mut, marginBottom: 4 }}>{label}</div>
      <input
        type="number"
        step={step ?? "any"}
        value={local}
        onChange={(e) => setLocal(parseFloat(e.target.value) || 0)}
        onBlur={() => onSave(local)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: C.bg,
          color: C.text,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "9px 11px",
          fontSize: 15,
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </label>
  );
}
