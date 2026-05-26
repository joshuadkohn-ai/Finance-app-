"use client";
import { useEffect, useState } from "react";
import { Plus, CreditCard, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, clampPercent } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Debt {
  id: string; name: string; type: string; balance: number; originalBalance?: number;
  interestRate: number; minimumPayment: number; dueDay?: number; payoffStrategy: string;
}

const DEBT_TYPES = ["CREDIT_CARD","STUDENT_LOAN","AUTO_LOAN","MORTGAGE","PERSONAL_LOAN","MEDICAL","OTHER"];
const DEBT_TYPE_LABELS: Record<string, string> = { CREDIT_CARD: "Credit Card", STUDENT_LOAN: "Student Loan", AUTO_LOAN: "Auto Loan", MORTGAGE: "Mortgage", PERSONAL_LOAN: "Personal Loan", MEDICAL: "Medical", OTHER: "Other" };

const defaultForm = { name: "", type: "CREDIT_CARD", balance: 0, originalBalance: 0, interestRate: 0, minimumPayment: 0, dueDay: 0, payoffStrategy: "AVALANCHE" };

function monthsToPayoff(balance: number, rate: number, payment: number): number {
  if (payment <= 0 || rate <= 0) return 0;
  const r = rate / 100 / 12;
  return Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r));
}

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [extraPayment, setExtraPayment] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => { const res = await fetch("/api/debt"); setDebts(await res.json()); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (d: Debt) => {
    setEditing(d);
    setForm({ name: d.name, type: d.type, balance: d.balance, originalBalance: d.originalBalance ?? 0, interestRate: d.interestRate, minimumPayment: d.minimumPayment, dueDay: d.dueDay ?? 0, payoffStrategy: d.payoffStrategy });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/debt/${editing.id}` : "/api/debt";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "Debt updated" : "Debt added" });
      setOpen(false);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/debt/${deleteId}`, { method: "DELETE" });
    toast({ title: "Debt removed" });
    load();
  };

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const minPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const avalanche = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const snowball = [...debts].sort((a, b) => a.balance - b.balance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Debt Tracker</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Debt</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Debt" value={totalDebt} color="red" />
        <StatCard title="Min. Monthly Payments" value={minPayments} />
        <StatCard title="Number of Debts" value={debts.length} format="number" />
      </div>

      {debts.length === 0 && <EmptyState icon={CreditCard} title="No debts tracked" description="Add your loans and credit cards to track payoff progress." action={{ label: "Add Debt", onClick: openNew }} />}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All Debts</TabsTrigger>
          <TabsTrigger value="avalanche">Avalanche</TabsTrigger>
          <TabsTrigger value="snowball">Snowball</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d) => {
              const paidPct = d.originalBalance && d.originalBalance > 0 ? clampPercent(((d.originalBalance - d.balance) / d.originalBalance) * 100) : 0;
              const months = monthsToPayoff(d.balance, d.interestRate, d.minimumPayment);
              return (
                <Card key={d.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold">{d.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">{DEBT_TYPE_LABELS[d.type]}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{formatCurrency(d.balance)}</p>
                        <p className="text-xs text-gray-400">{d.interestRate}% APR</p>
                      </div>
                    </div>
                    {paidPct > 0 && <div className="mt-3"><Progress value={paidPct} className="h-2" indicatorClassName="bg-emerald-500" /><p className="text-xs text-gray-400 mt-1">{paidPct.toFixed(0)}% paid off</p></div>}
                    <div className="flex justify-between mt-3 text-xs text-gray-500">
                      <span>Min: {formatCurrency(d.minimumPayment)}/mo</span>
                      {months > 0 && <span>~{months} months to payoff</span>}
                    </div>
                    <div className="flex gap-1 mt-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(d)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setDeleteId(d.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="avalanche">
          <Card>
            <CardHeader><CardTitle>Avalanche — Highest Interest First</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Pay minimums on all debts, then put extra money toward the highest-interest debt.</p>
              <div className="mb-4 flex items-center gap-2">
                <Label>Extra Monthly Payment: </Label>
                <Input type="number" value={extraPayment} onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)} className="w-32 h-8" />
              </div>
              {avalanche.map((d, i) => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : ""} mb-2`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                    <div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-400">{d.interestRate}% APR</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(d.balance)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(i === 0 ? d.minimumPayment + extraPayment : d.minimumPayment)}/mo</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snowball">
          <Card>
            <CardHeader><CardTitle>Snowball — Lowest Balance First</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Pay minimums on all debts, then put extra money toward the smallest balance for quick wins.</p>
              <div className="mb-4 flex items-center gap-2">
                <Label>Extra Monthly Payment: </Label>
                <Input type="number" value={extraPayment} onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)} className="w-32 h-8" />
              </div>
              {snowball.map((d, i) => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : ""} mb-2`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                    <div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-400">{formatCurrency(d.balance)} balance</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(i === 0 ? d.minimumPayment + extraPayment : d.minimumPayment)}/mo</p>
                    <p className="text-xs text-gray-400">{monthsToPayoff(d.balance, d.interestRate, i === 0 ? d.minimumPayment + extraPayment : d.minimumPayment)} months</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Debt" : "Add Debt"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Chase Sapphire, Student Loans…" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{DEBT_TYPES.map((t) => <SelectItem key={t} value={t}>{DEBT_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Current Balance</Label><Input type="number" value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>APR (%)</Label><Input type="number" value={form.interestRate} onChange={(e) => setForm((f) => ({ ...f, interestRate: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
              <div><Label>Min. Payment</Label><Input type="number" value={form.minimumPayment} onChange={(e) => setForm((f) => ({ ...f, minimumPayment: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Remove debt?" onConfirm={del} />
    </div>
  );
}
