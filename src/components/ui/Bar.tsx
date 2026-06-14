import { C } from "@/lib/colors";

interface BarProps {
  pct: number;
  color?: string;
}

export default function Bar({ pct, color }: BarProps) {
  return (
    <div
      style={{
        height: 6,
        background: C.line,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          background: color ?? C.em,
          transition: "width .5s",
        }}
      />
    </div>
  );
}
