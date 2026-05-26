"use client";
import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, isAsset, isLiability, accountTypeLabel, groupBy } from "@/lib/utils";
import { ACCOUNT_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { FinancialAccount } from "@/types";

const ACCOUNT_TYPES = [
  "CHECKING","SAVINGS","CREDIT_CARD","LOAN","MORTGAGE","INVESTMENT",
  "RETIREMENT","CRYPTO","REAL_ESTATE","VEHICLE","CASH","OTHER_ASSET","OTHER_LIABILITY",
];

const defaultForm = { name: "", type: "CHECKING", institution: "", balance: 0, interestRate: 0, minimumPayment: 0, creditLimit: 0, note: "", excludeFromNetWorth: false, excludeFromBudget: false };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (a: FinancialAccount) => {
    setEditing(a);
    setForm({ name: a.name, type: a.type, institution: a.institution ?? "", balance: a.balance, interestRate: a.interestRate ?? 0, minimumPayment: a.minimumPayment ?? 0, creditLimit: a.creditLimit ?? 0, note: a.note ?? "", excludeFromNetWorth: a.excludeFromNetWorth, excludeFromBudget: a.excludeFromBudget });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/accounts/${editing.id}` : "/api/accounts";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "Account updated" : "Account added", variant: "default" });
      setOpen(false);
      load();
    } catch {
      toast({ title: "Error saving account", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleHide = async (a: FinancialAccount) => {
    await fetch(`/api/accounts/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isHidden: !a.isHidden }) });
    load();
  };

  const deleteAccount = async () => {
    if (!deleteId) return;
    await fetch(`/api/accounts/${deleteId}`, { method: "DELETE" });
    toast({ title: "Account deleted" });
    load();
  };

  const visible = accounts.filter((a) => !a.isHidden);
  const totalAssets = visible.filter((a) => isAsset(a.type) && !a.excludeFromNetWorth).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = visible.filter((a) => isLiability(a.type) && !a.excludeFromNetWorth).reduce((s, a) => s + a.balance, 0);
  const grouped = groupBy(visible, (a) => isAsset(a.type) ? "Assets" : "Liabilities");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Net Worth" value={totalAssets - totalLiabilities} color={totalAssets - totalLiabilities >= 0 ? "green" : "red"} />
        <StatCard title="Total Assets" value={totalAssets} color="blue" />
        <StatCard title="Total Liabilities" value={totalLiabilities} color="red" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Accounts</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Account</Button>
      </div>

      {accounts.length === 0 && (
        <EmptyState icon={Building2} title="No accounts yet" description="Add your first account to start tracking your finances." action={{ label: "Add Account", onClick: openNew }} />
      )}

      {Object.entries(grouped).map(([group, accts]) => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle>{group} <span className="text-gray-400 font-normal ml-2">{formatCurrency(accts.reduce((s, a) => s + a.balance, 0))}</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accts.map((a) => (
              <div key={a.id} className={`flex items-center justify-between rounded-lg p-3 ${a.isHidden ? "opacity-50" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: ACCOUNT_COLORS[a.type] ?? "#6366f1" }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-gray-400">{accountTypeLabel(a.type)} {a.institution ? `· ${a.institution}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isLiability(a.type) ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{formatCurrency(a.balance)}</p>
                    {a.excludeFromNetWorth && <Badge variant="secondary" className="text-xs">Excluded</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleHide(a)} className="h-7 w-7">
                      {a.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)} className="h-7 w-7 text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Account Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Chase Checking" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{accountTypeLabel(t)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Balance</Label>
                <Input type="number" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Institution (optional)</Label>
              <Input value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} placeholder="Chase, Fidelity…" className="mt-1" />
            </div>
            {["CREDIT_CARD", "LOAN", "MORTGAGE"].includes(form.type) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: parseFloat(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label>Min. Payment</Label>
                  <Input type="number" value={form.minimumPayment} onChange={(e) => setForm((f) => ({ ...f, minimumPayment: parseFloat(e.target.value) || 0 }))} className="mt-1" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={form.excludeFromNetWorth} onCheckedChange={(v) => setForm((f) => ({ ...f, excludeFromNetWorth: v }))} />
                Exclude from net worth
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={form.excludeFromBudget} onCheckedChange={(v) => setForm((f) => ({ ...f, excludeFromBudget: v }))} />
                Exclude from budget
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete account?"
        description="All transactions for this account will also be deleted. This cannot be undone."
        onConfirm={deleteAccount}
      />
    </div>
  );
}
