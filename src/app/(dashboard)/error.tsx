"use client";

import { C } from "@/lib/colors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.red}`,
        borderRadius: 16,
        padding: 28,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, color: C.red, marginBottom: 8 }}>
        Something went wrong
      </div>
      <div style={{ fontSize: 13, color: C.mut, marginBottom: 20 }}>
        {error.message || "An unexpected error occurred."}
      </div>
      <button
        onClick={reset}
        style={{
          background: C.em,
          color: "#06281C",
          border: "none",
          borderRadius: 8,
          padding: "8px 20px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
