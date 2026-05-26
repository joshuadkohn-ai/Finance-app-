"use client";
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { FREQ_LABELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface Rec {
  id: string; merchant: string; amount: number; type: string; frequency: string;
  nextDueDate: string; status: string; notes?: string; categoryId?: string;
}
interface Account { id: string; name: string }

const defaultForm = { merchant: "", amount: 0, type: "DEBIT", accountId: "", frequency: "MONTHLY", nextDueDate: "", status: "KEEP", notes: "" };

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<Rec[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [rRes, aRes] = await Promise.all([fetch("/api/recurring"), fetch("/api/accounts")]);
    setRecurring(await rRes.json());
    setAccounts(await aRes.json());
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.merchant || !form.accountId || !form.nextDueDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/recurring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast({ title: "Recurring bill added" });
      setOpen(false);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/recurring/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/recurring/${deleteId}`, { method: "DELETE" });
    toast({ title: "Recurring bill removed" });
    load();
  };

  const monthlyTotal = recurring.filter((r) => r.type === "DEBIT").reduce((s, r) => {
    const multiplier: Record<string, number> = { DAILY: 30, WEEKLY: 4.3, BIWEEKLY: 2.15, MONTHLY: 1, QUARTERLY: 1/3, ANNUAL: 1/12 };
    return s + r.amount * (multiplier[r.frequency] ?? 1);
  }, 0);

  const statusColor = (s: string) => ({ KEEP: "success", CANCEL: "destructive", REVIEW: "warning" } as any)[s] ?? "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recurring Bills & Subscriptions</h2>
          <p className="text-sm text-gray-500">Monthly total: <strong>{formatCurrency(monthlyTotal)}</strong></p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Bill</Button>
      </div>

      {recurring.length === 0 && (
        <EmptyState icon={RefreshCw} title="No recurring bills" description="Add your bills, subscriptions, and regular income." action={{ label: "Add Bill", onClick: () => setOpen(true) }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurring.map((r) => {
          const due = new Date(r.nextDueDate);
          const daysUntil = Math.round((due.getTime() - Date.now()) / 86400000);
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{r.merchant}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusColor(r.status)}>{r.status}</Badge>
                      <span className="text-xs text-gray-400">{FREQ_LABELS[r.frequency]}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${r.type === "CREDIT" ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}>
                      {r.type === "CREDIT" ? "+" : "-"}{formatCurrency(r.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>Due {formatShortDate(r.nextDueDate)}</span>
                    {daysUntil >= 0 && daysUntil <= 7 && <Badge variant="warning" className="ml-1 text-xs">Soon</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEEP">Keep</SelectItem>
                        <SelectItem value="CANCEL">Cancel</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Recurring Bill</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name / Merchant</Label>
              <Input value={form.merchant} onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))} placeholder="Netflix, Spotify, Rent…" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DEBIT">Expense</SelectItem><SelectItem value="CREDIT">Income</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(FREQ_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Next Due Date</Label>
                <Input type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Account</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select account…" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Remove recurring bill?" onConfirm={del} />
    </div>
  );
}
