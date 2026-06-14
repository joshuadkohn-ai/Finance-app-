import { C } from "@/lib/colors";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }`}</style>
      {[220, 160, 120].map((h, i) => (
        <div
          key={i}
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            height: h,
          }}
        />
      ))}
    </div>
  );
}
