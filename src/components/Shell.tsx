"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { C } from "@/lib/colors";

const TABS: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/paycheck", "Paycheck"],
  ["/budget", "Budget"],
  ["/accounts", "Accounts"],
  ["/plan", "Plan"],
  ["/settings", "Settings"],
];

interface ShellProps {
  children: React.ReactNode;
  userName?: string | null;
}

export default function Shell({ children, userName }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600&display=swap');`}</style>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "22px 16px 80px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
            style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600 }}
          >
            J&amp;E{" "}
            <span style={{ color: C.em }}>Capital</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12, color: C.mut }}>{monthName}</span>
            {userName && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  fontSize: 12,
                  color: C.mut,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {userName} · sign out
              </button>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {TABS.map(([href, label]) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  background: active ? C.em : C.card,
                  color: active ? "#06281C" : C.text,
                  border: `1px solid ${active ? C.em : C.line}`,
                  borderRadius: 20,
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
