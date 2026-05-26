"use client";
import { useEffect, useState } from "react";
import { Plus, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, clampPercent, currentMonthYear, getMonthName } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BudgetCategory {
  id: string; categoryId: string; planned: number; actual: number; rollover: boolean; isFixed: boolean;
  category: { name: string; emoji?: string };
}
interface Budget {
  id: string; month: number; year: number; income: number; mode: string;
  categories: BudgetCategory[];
}
interface Category { id: string; name: string; emoji?: string; groupId?: string; isIncome?: boolean }

export default function BudgetPage() {
  const { month, year } = currentMonthYear();
  const [selMonth, setSelMonth] = useState(month);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ categoryId: "", planned: 0, rollover: false, isFixed: false });
  const [income, setIncome] = useState(0);
  const { toast } = useToast();

  const load = async (m = selMonth) => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/budget?month=${m}&year=${year}`),
      fetch("/api/categories"),
    ]);
    const bData = await bRes.json();
    const cData = await cRes.json();
    setBudget(bData);
    setIncome(bData?.income ?? 0);
    setCategories(cData.categories ?? []);
    setLoading(false);
  };

  useEffect(() => { load(selMonth); }, [selMonth]);

  const saveBudget = async (extra?: Partial<typeof addForm>) => {
    const cats = budget?.categories.map((bc) => ({ categoryId: bc.categoryId, planned: bc.planned, rollover: bc.rollover, isFixed: bc.isFixed })) ?? [];
    if (extra) cats.push({ categoryId: addForm.categoryId, planned: addForm.planned, rollover: addForm.rollover, isFixed: addForm.isFixed, ...extra } as any);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: selMonth, year, income, categories: cats }),
    });
    if (!res.ok) { toast({ title: "Error saving budget", variant: "destructive" }); return; }
    toast({ title: "Budget saved" });
    setAddOpen(false);
    load(selMonth);
  };

  const totalPlanned = budget?.categories.reduce((s, c) => s + c.planned, 0) ?? 0;
  const totalActual = budget?.categories.reduce((s, c) => s + c.actual, 0) ?? 0;
  const unallocated = income - totalPlanned;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {months.map((m, i) => (
            <button key={i} onClick={() => setSelMonth(i + 1)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selMonth === i + 1 ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{m}</button>
          ))}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Category</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label className="text-xs">Monthly Income</Label>
          <Input type="number" value={income} onChange={(e) => setIncome(parseFloat(e.target.value) || 0)} onBlur={() => saveBudget()} className="mt-1 font-semibold" />
        </div>
        <StatCard title="Planned" value={totalPlanned} />
        <StatCard title="Spent" value={totalActual} />
        <StatCard title="Unallocated" value={unallocated} color={unallocated >= 0 ? "green" : "red"} />
      </div>

      {/* Category rows */}
      {(!budget || budget.categories.length === 0) ? (
        <EmptyState icon={PieChart} title="No budget categories" description="Add categories to start planning your monthly budget." action={{ label: "Add Category", onClick: () => setAddOpen(true) }} />
      ) : (
        <div className="space-y-2">
          {budget.categories.map((bc) => {
            const pct = clampPercent(bc.planned > 0 ? (bc.actual / bc.planned) * 100 : 0);
            const over = bc.actual > bc.planned && bc.planned > 0;
            return (
              <div key={bc.id} className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{bc.category.emoji} {bc.category.name}</span>
                    {bc.isFixed && <Badge variant="secondary" className="text-xs">Fixed</Badge>}
                    {over && <Badge variant="destructive" className="text-xs">Over</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">{formatCurrency(bc.actual)} spent</span>
                    <span className="font-semibold">{formatCurrency(bc.planned)} planned</span>
                    <Input
                      type="number"
                      defaultValue={bc.planned}
                      className="w-24 h-7 text-xs"
                      onBlur={(e) => {
                        const newPlanned = parseFloat(e.target.value) || 0;
                        const cats = budget.categories.map((c) => ({ categoryId: c.categoryId, planned: c.id === bc.id ? newPlanned : c.planned, rollover: c.rollover, isFixed: c.isFixed }));
                        fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: selMonth, year, income, categories: cats }) }).then(() => load(selMonth));
                      }}
                    />
                  </div>
                </div>
                <Progress value={pct} className="h-2" indicatorClassName={over ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-indigo-600"} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{pct.toFixed(0)}% used</span>
                  <span>{formatCurrency(Math.max(0, bc.planned - bc.actual))} remaining</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add category dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Budget Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <Select value={addForm.categoryId} onValueChange={(v) => setAddForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{categories.filter((c) => !c.isIncome).map((c) => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Planned Amount</Label>
              <Input type="number" value={addForm.planned} onChange={(e) => setAddForm((f) => ({ ...f, planned: parseFloat(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => saveBudget()} disabled={!addForm.categoryId}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
