import { C } from "@/lib/colors";

interface CCardProps {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function CCard({ title, right, children, style }: CCardProps) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 18,
        ...style,
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: C.mut,
            }}
          >
            {title}
          </span>
          {right && (
            <span style={{ fontSize: 12, color: C.mut }}>{right}</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
