"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Plus, Filter, Download, Check, Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatShortDate, debounce } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Tx {
  id: string; date: string; merchant: string; amount: number; type: string;
  categoryId?: string; notes?: string; isReviewed: boolean; isIgnored: boolean;
  isRecurring?: boolean;
  category?: { name: string; emoji?: string }; account?: { name: string };
  tags: string[];
}
interface Category { id: string; name: string; emoji?: string }
interface Account { id: string; name: string }

const defaultForm = { date: new Date().toISOString().split("T")[0], merchant: "", amount: 0, type: "DEBIT", accountId: "", categoryId: "", notes: "" };

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear] = useState(String(new Date().getFullYear()));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const LIMIT = 50;

  const load = useCallback(async (p = 1, q = search) => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), search: q, month: filterMonth, year: filterYear });
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTxns(data.transactions ?? []);
    setTotal(data.total ?? 0);
  }, [search, filterMonth, filterYear]);

  const debouncedSearch = useRef(debounce((q: string) => { setPage(1); load(1, q); }, 300));

  useEffect(() => { load(page); }, [page, filterMonth, filterYear]);
  useEffect(() => { Promise.all([fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories ?? [])), fetch("/api/accounts").then(r => r.json()).then(setAccounts)]); }, []);

  const handleSearch = (q: string) => { setSearch(q); debouncedSearch.current(q); };

  const openNew = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (t: Tx) => {
    setEditing(t);
    setForm({ date: t.date.split("T")[0], merchant: t.merchant, amount: t.amount, type: t.type, accountId: (t as any).accountId ?? "", categoryId: t.categoryId ?? "", notes: t.notes ?? "" });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/transactions/${editing.id}` : "/api/transactions";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, categoryId: form.categoryId || null }) });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "Transaction updated" : "Transaction added" });
      setOpen(false);
      load(page);
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const markReviewed = async (ids: string[]) => {
    await Promise.all(ids.map(id => fetch(`/api/transactions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isReviewed: true }) })));
    load(page);
    setSelected(new Set());
  };

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/transactions/${deleteId}`, { method: "DELETE" });
    toast({ title: "Transaction deleted" });
    load(page);
  };

  const exportCsv = () => {
    const headers = "Date,Merchant,Amount,Type,Category,Account";
    const rows = txns.map((t) => `${t.date},${t.merchant},${t.amount},${t.type},${t.category?.name ?? ""},${t.account?.name ?? ""}`);
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click();
  };

  const allSelected = txns.length > 0 && txns.every((t) => selected.has(t.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(txns.map((t) => t.id)));

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search transactions…" value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterMonth} onValueChange={(v) => { setFilterMonth(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        {selected.size > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markReviewed([...selected])}>
            <Check className="h-3.5 w-3.5 mr-1" /> Mark {selected.size} reviewed
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
        <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_120px_100px_100px_80px] gap-0 px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="flex items-center pr-3">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          </div>
          <div>Merchant</div>
          <div>Category</div>
          <div>Account</div>
          <div className="text-right">Amount</div>
          <div />
        </div>

        {txns.length === 0 && <EmptyState icon={ArrowLeftRight} title="No transactions" description="Add a transaction or import a CSV file." className="py-12" />}

        {txns.map((t) => (
          <div key={t.id} className={`grid grid-cols-[auto_1fr_120px_100px_100px_80px] gap-0 px-4 py-2.5 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${t.isIgnored ? "opacity-40" : ""}`}>
            <div className="flex items-center pr-3">
              <Checkbox checked={selected.has(t.id)} onCheckedChange={(c) => setSelected((s) => { const n = new Set(s); c ? n.add(t.id) : n.delete(t.id); return n; })} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{t.merchant}</span>
                {t.isReviewed && <span className="text-emerald-500 text-xs">✓</span>}
                {t.isRecurring && <Badge variant="secondary" className="text-xs py-0">↻</Badge>}
              </div>
              <span className="text-xs text-gray-400">{formatShortDate(t.date)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm truncate text-gray-600 dark:text-gray-400">
                {t.category?.emoji} {t.category?.name ?? <span className="text-gray-300">—</span>}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-500 truncate">{t.account?.name}</div>
            <div className="flex items-center justify-end">
              <span className={`text-sm font-semibold ${t.type === "CREDIT" ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}>
                {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500">
            <span>{total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Transaction" : "Add Transaction"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Merchant / Description</Label>
              <Input value={form.merchant} onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">Expense</SelectItem>
                    <SelectItem value="CREDIT">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account</Label>
                <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category…" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional note…" className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete transaction?" onConfirm={del} />
    </div>
  );
}
