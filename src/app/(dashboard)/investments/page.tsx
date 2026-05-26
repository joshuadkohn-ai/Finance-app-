"use client";
import { useEffect, useState } from "react";
import { Plus, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f97316"];
const ASSET_CLASSES = ["STOCK","ETF","BOND","CRYPTO","CASH","REAL_ESTATE","ALTERNATIVE","OTHER"];

interface Holding { id: string; symbol: string; name: string; quantity: number; costBasis: number; currentPrice: number; assetClass: string }
interface InvAccount { id: string; name: string; type: string; holdings: Holding[] }

const defaultForm = { accountId: "", symbol: "", name: "", quantity: 0, costBasis: 0, currentPrice: 0, assetClass: "STOCK" };

export default function InvestmentsPage() {
  const [accounts, setAccounts] = useState<InvAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => { const res = await fetch("/api/investments"); setAccounts(await res.json()); };
  useEffect(() => { load(); }, []);

  const allHoldings = accounts.flatMap((a) => a.holdings.map((h) => ({ ...h, accountName: a.name })));
  const totalValue = allHoldings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalCost = allHoldings.reduce((s, h) => s + h.quantity * h.costBasis, 0);
  const totalGain = totalValue - totalCost;

  const byClass: Record<string, number> = {};
  for (const h of allHoldings) {
    byClass[h.assetClass] = (byClass[h.assetClass] ?? 0) + h.quantity * h.currentPrice;
  }
  const pieData = Object.entries(byClass).map(([name, value]) => ({ name, value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast({ title: "Holding added" });
      setOpen(false);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investment Portfolio</h2>
        <Button onClick={() => { setForm(defaultForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Holding</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Value" value={totalValue} color="blue" />
        <StatCard title="Total Cost Basis" value={totalCost} />
        <StatCard title="Total Gain/Loss" value={totalGain} color={totalGain >= 0 ? "green" : "red"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Asset Allocation</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No holdings</p> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} /></PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />{d.name}</span>
                      <span>{totalValue > 0 ? formatPercent((d.value / totalValue) * 100) : "0%"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Holdings</CardTitle></CardHeader>
          <CardContent>
            {allHoldings.length === 0 && <EmptyState icon={BarChart2} title="No holdings" description="Add investment holdings manually." />}
            <div className="space-y-2">
              {allHoldings.map((h) => {
                const value = h.quantity * h.currentPrice;
                const gain = value - h.quantity * h.costBasis;
                const gainPct = h.costBasis > 0 ? (gain / (h.quantity * h.costBasis)) * 100 : 0;
                return (
                  <div key={h.id} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{h.symbol}</span>
                        <span className="text-xs text-gray-500">{h.name}</span>
                        <Badge variant="secondary" className="text-xs">{h.assetClass}</Badge>
                      </div>
                      <div className="text-xs text-gray-400">{h.quantity} shares @ {formatCurrency(h.currentPrice)}</div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(value)}</p>
                      <p className={`text-xs ${gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>{gain >= 0 ? "+" : ""}{formatCurrency(gain)} ({formatPercent(gainPct)})</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Holding</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Account</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select investment account…" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ticker Symbol</Label>
                <Input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))} placeholder="AAPL" className="mt-1" />
              </div>
              <div>
                <Label>Asset Class</Label>
                <Select value={form.assetClass} onValueChange={(v) => setForm((f) => ({ ...f, assetClass: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Apple Inc." className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Shares</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Cost Basis</Label>
                <Input type="number" value={form.costBasis} onChange={(e) => setForm((f) => ({ ...f, costBasis: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Current Price</Label>
                <Input type="number" value={form.currentPrice} onChange={(e) => setForm((f) => ({ ...f, currentPrice: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
