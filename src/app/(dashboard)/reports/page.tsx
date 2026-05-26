"use client";
import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f97316","#ec4899","#14b8a6"];
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(String(now.getMonth() + 1));
  const [selYear] = useState(String(now.getFullYear()));
  const [spending, setSpending] = useState<{ name: string; amount: number; emoji?: string | null }[]>([]);
  const [cashflow, setCashflow] = useState<{ month: string; year?: number; income: number; expenses: number; net: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports?type=spending&month=${selMonth}&year=${selYear}`).then(r => r.json()),
      fetch(`/api/reports?type=cashflow&month=${selMonth}&year=${selYear}`).then(r => r.json()),
    ]).then(([s, cf]) => {
      setSpending(s.categories ?? []);
      setCashflow(cf.months ?? []);
      setLoading(false);
    });
  }, [selMonth, selYear]);

  const totalSpent = spending.reduce((s, c) => s + c.amount, 0);

  const exportCsv = (data: object[], name: string) => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map((row) => keys.map((k) => (row as any)[k]).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports & Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={selMonth} onValueChange={setSelMonth}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="spending">
        <TabsList>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="comparison">Monthly Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCsv(spending, "spending")}><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart><Pie data={spending} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${formatPercent((percent ?? 0) * 100, 0)}`} labelLine={false}>
                    {spending.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {spending.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{s.emoji} {s.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(s.amount)}</span>
                        <span className="text-xs text-gray-400 ml-2">{totalSpent > 0 ? formatPercent((s.amount / totalSpent) * 100) : "0%"}</span>
                      </div>
                    </div>
                  ))}
                  {spending.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No spending data for this month.</p>}
                </div>
                {totalSpent > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                    <span className="font-semibold text-sm">Total</span>
                    <span className="font-bold text-sm">{formatCurrency(totalSpent)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Top Spending Categories</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={spending.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {spending.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCsv(cashflow, "cashflow")}><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Month-over-Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashflow} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left py-2">Month</th><th className="text-right py-2">Income</th><th className="text-right py-2">Expenses</th><th className="text-right py-2">Net</th>
              </tr></thead>
              <tbody>{cashflow.map((r) => (
                <tr key={r.month} className="border-b border-gray-50 dark:border-gray-800/50">
                  <td className="py-2 font-medium">{r.month} {r.year}</td>
                  <td className="py-2 text-right text-emerald-600">{formatCurrency(r.income)}</td>
                  <td className="py-2 text-right text-red-500">{formatCurrency(r.expenses)}</td>
                  <td className={`py-2 text-right font-semibold ${r.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatCurrency(r.net)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
