"use client";

import { useState, useEffect, useTransition } from "react";
import { C } from "@/lib/colors";

const fmt2 = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface EditNumProps {
  val: number;
  onSave: (v: number) => Promise<void>;
  color?: string;
  size?: number;
}

export default function EditNum({ val, onSave, color, size }: EditNumProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(Math.round(val * 100) / 100));
  const [localVal, setLocalVal] = useState(val);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLocalVal(val);
  }, [val]);

  const save = () => {
    const parsed = parseFloat(input);
    const newVal = Number.isFinite(parsed) ? parsed : localVal;
    setLocalVal(newVal);
    setEditing(false);
    startTransition(async () => {
      await onSave(newVal);
    });
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        style={{
          width: 110,
          background: C.bg,
          color: C.text,
          border: `1px solid ${C.em}`,
          borderRadius: 6,
          padding: "4px 8px",
          fontSize: size ?? 14,
          fontVariantNumeric: "tabular-nums",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setInput(String(Math.round(localVal * 100) / 100));
        setEditing(true);
      }}
      title="Tap to edit"
      style={{
        cursor: "pointer",
        borderBottom: `1px dashed ${C.line}`,
        color: color ?? C.text,
        fontSize: size ?? 14,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {fmt2(localVal)}
    </span>
  );
}
