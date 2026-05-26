"use client";
import { useEffect, useState } from "react";
import { Plus, Target, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, clampPercent } from "@/lib/utils";
import { GOAL_ICONS, GOAL_TYPE_LABELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string; name: string; type: string; targetAmount: number; currentAmount: number;
  targetDate?: string; monthlyContrib: number; isCompleted: boolean; note?: string;
}

const GOAL_COLORS: Record<string, string> = {
  SAVINGS: "bg-blue-100 text-blue-700",
  DEBT_PAYOFF: "bg-red-100 text-red-700",
  INVESTMENT: "bg-purple-100 text-purple-700",
  EMERGENCY_FUND: "bg-amber-100 text-amber-700",
  VACATION: "bg-cyan-100 text-cyan-700",
  DOWN_PAYMENT: "bg-emerald-100 text-emerald-700",
  WEDDING: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const defaultForm = { name: "", type: "SAVINGS", targetAmount: 0, currentAmount: 0, targetDate: "", monthlyContrib: 0, note: "" };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ name: g.name, type: g.type, targetAmount: g.targetAmount, currentAmount: g.currentAmount, targetDate: g.targetDate?.split("T")[0] ?? "", monthlyContrib: g.monthlyContrib, note: g.note ?? "" });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, targetDate: form.targetDate || null }) });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "Goal updated" : "Goal created" });
      setOpen(false);
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!deleteId) return;
    await fetch(`/api/goals/${deleteId}`, { method: "DELETE" });
    toast({ title: "Goal deleted" });
    load();
  };

  const projectedMonths = (g: Goal) => {
    const remaining = g.targetAmount - g.currentAmount;
    if (g.monthlyContrib <= 0 || remaining <= 0) return null;
    return Math.ceil(remaining / g.monthlyContrib);
  };

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{active.length} Active Goals</h2>
          <p className="text-sm text-gray-500">{completed.length} completed</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Goal</Button>
      </div>

      {goals.length === 0 && (
        <EmptyState icon={Target} title="No goals yet" description="Set a savings goal, pay off debt, or plan your next vacation." action={{ label: "Create Goal", onClick: openNew }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((g) => {
          const pct = clampPercent((g.currentAmount / g.targetAmount) * 100);
          const months = projectedMonths(g);
          return (
            <Card key={g.id} className="relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-2xl">{GOAL_ICONS[g.type]}</span>
                    <h3 className="text-sm font-semibold mt-1">{g.name}</h3>
                    <Badge className={`text-xs mt-1 ${GOAL_COLORS[g.type]}`} variant="outline">{GOAL_TYPE_LABELS[g.type]}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{formatCurrency(g.currentAmount)}</span>
                    <span className="text-gray-400">{formatCurrency(g.targetAmount)}</span>
                  </div>
                  <Progress value={pct} className="h-2.5" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pct.toFixed(1)}% saved</span>
                    <span>{formatCurrency(g.targetAmount - g.currentAmount)} to go</span>
                  </div>
                </div>

                {(months || g.targetDate) && (
                  <div className="mt-3 flex gap-3 text-xs text-gray-400">
                    {g.monthlyContrib > 0 && <span>+{formatCurrency(g.monthlyContrib)}/mo</span>}
                    {months && <span>~{months} months to goal</span>}
                    {g.targetDate && <span>Target: {new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Completed</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completed.map((g) => (
              <Card key={g.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span>{GOAL_ICONS[g.type]}</span>
                    <span className="text-sm font-medium">{g.name}</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(g.targetAmount)} achieved</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Goal" : "New Goal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Goal Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{GOAL_ICONS[k]} {v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Amount</Label>
                <Input type="number" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Current Amount</Label>
                <Input type="number" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monthly Contribution</Label>
                <Input type="number" value={form.monthlyContrib} onChange={(e) => setForm((f) => ({ ...f, monthlyContrib: parseFloat(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete goal?" onConfirm={del} />
    </div>
  );
}
