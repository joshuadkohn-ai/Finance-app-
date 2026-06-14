"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/colors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 28,
              fontWeight: 600,
              color: C.text,
              marginBottom: 6,
            }}
          >
            J&amp;E <span style={{ color: C.em }}>Capital</span>
          </div>
          <div style={{ fontSize: 14, color: C.mut }}>
            Family finance dashboard
          </div>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: C.mut, marginBottom: 6 }}>Email</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="josh@household.local"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 15,
                }}
              />
            </label>

            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: C.mut, marginBottom: 6 }}>Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 15,
                }}
              />
            </label>

            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: C.red,
                  background: `${C.red}18`,
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? C.line : C.em,
                color: loading ? C.mut : "#06281C",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                marginTop: 4,
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
