"use client";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

interface MonthData { month: string; year: number; income: number; expenses: number; net: number }

export default function CashFlowPage() {
  const [data, setData] = useState<MonthData[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      fetch(`/api/reports?type=cashflow&month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(r => r.json()),
      fetch("/api/recurring").then(r => r.json()),
    ]).then(([cf, rec]) => {
      setData(cf.months ?? []);
      setRecurring(rec);
      setLoading(false);
    });
  }, []);

  const latest = data[data.length - 1];
  const avgIncome = data.length ? data.reduce((s, d) => s + d.income, 0) / data.length : 0;
  const avgExpenses = data.length ? data.reduce((s, d) => s + d.expenses, 0) / data.length : 0;

  const upcomingExpenses = recurring.filter((r) => r.type === "DEBIT").reduce((s: number, r: any) => {
    const mult: Record<string, number> = { DAILY: 30, WEEKLY: 4.3, BIWEEKLY: 2.15, MONTHLY: 1, QUARTERLY: 1/3, ANNUAL: 1/12 };
    return s + r.amount * (mult[r.frequency] ?? 1);
  }, 0);

  const safeToSpend = latest ? Math.max(0, latest.income - latest.expenses) : 0;

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="This Month Income" value={latest?.income ?? 0} color="green" />
        <StatCard title="This Month Expenses" value={latest?.expenses ?? 0} color="red" />
        <StatCard title="Safe to Spend" value={safeToSpend} color="blue" />
        <StatCard title="Recurring/mo" value={upcomingExpenses} />
      </div>

      <Card>
        <CardHeader><CardTitle>Income vs Expenses (6 Months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Net Cash Flow Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Averages</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Monthly Income</span><span className="font-semibold text-emerald-600">{formatCurrency(avgIncome)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Monthly Expenses</span><span className="font-semibold text-red-500">{formatCurrency(avgExpenses)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Net</span><span className={`font-semibold ${avgIncome - avgExpenses >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatCurrency(avgIncome - avgExpenses)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projected Next Month</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Expected Income</span><span className="font-semibold">{formatCurrency(avgIncome)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Recurring Bills</span><span className="font-semibold">{formatCurrency(upcomingExpenses)}</span></div>
            <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-800 pt-2"><span className="font-medium">Projected Net</span><span className={`font-bold ${avgIncome - upcomingExpenses >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatCurrency(avgIncome - upcomingExpenses)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
