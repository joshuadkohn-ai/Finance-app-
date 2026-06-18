import { getFullState } from "@/lib/db";
import { updateAccountBal } from "@/app/actions";
import { C, GCOL } from "@/lib/colors";
import CCard from "@/components/ui/CCard";
import EditNum from "@/components/ui/EditNum";

export const dynamic = "force-dynamic";

const fmt2 = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const GROUPS = ["Cash", "Investments", "Retirement"] as const;

export default async function AccountsPage() {
  const { accounts } = await getFullState();

  const groupSum = (g: string) =>
    accounts.filter((a) => a.group === g).reduce((s, a) => s + a.bal, 0);

  return (
    <>
      {GROUPS.map((g) => (
        <CCard
          key={g}
          title={g}
          right={fmt2(groupSum(g))}
          style={{ marginBottom: 14 }}
        >
          {accounts
            .filter((a) => a.group === g)
            .map((a) => (
              <div
                key={a.slug}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 0",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span style={{ fontSize: 14 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: GCOL[g],
                      marginRight: 10,
                    }}
                  />
                  {a.name}
                </span>
                <EditNum
                  val={a.bal}
                  onSave={updateAccountBal.bind(null, a.slug)}
                  size={15}
                />
              </div>
            ))}
        </CCard>
      ))}
      <div style={{ fontSize: 12, color: C.mut }}>
        Tap a balance to update it — net worth, charts, and projections update
        instantly.
      </div>
    </>
  );
}
