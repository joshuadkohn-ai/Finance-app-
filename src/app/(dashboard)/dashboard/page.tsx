"use client";
import { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatShortDate, isAsset, isLiability, currentMonthYear, clampPercent } from "@/lib/utils";
import { GOAL_ICONS } from "@/lib/constants";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { FinancialAccount, Transaction, Goal, RecurringTransaction } from "@/types";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

export default function DashboardPage() {
  const { month, year } = currentMonthYear();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [cashflow, setCashflow] = useState<{ month: string; income: number; expenses: number }[]>([]);
  const [spending, setSpending] = useState<{ name: string; amount: number; emoji?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [acctRes, txRes, goalRes, recRes, cfRes, spendRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(`/api/transactions?month=${month}&year=${year}&limit=10`),
        fetch("/api/goals"),
        fetch("/api/recurring"),
        fetch(`/api/reports?type=cashflow&month=${month}&year=${year}`),
        fetch(`/api/reports?type=spending&month=${month}&year=${year}`),
      ]);
      const [accts, txData, goalData, recData, cfData, spendData] = await Promise.all([
        acctRes.json(), txRes.json(), goalRes.json(), recRes.json(), cfRes.json(), spendRes.json(),
      ]);
      setAccounts(accts);
      setTransactions(txData.transactions ?? []);
      setGoals(goalData);
      setRecurring(recData);
      setCashflow(cfData.months ?? []);
      setSpending((spendData.categories ?? []).slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const assets = accounts.filter((a) => isAsset(a.type) && !a.excludeFromNetWorth).reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter((a) => isLiability(a.type) && !a.excludeFromNetWorth).reduce((s, a) => s + a.balance, 0);
  const netWorth = assets - liabilities;
  const monthIncome = transactions.filter((t: any) => t.type === "CREDIT").reduce((s: number, t: any) => s + t.amount, 0);
  const monthSpend = transactions.filter((t: any) => t.type === "DEBIT").reduce((s: number, t: any) => s + t.amount, 0);
  const upcomingBills = recurring.filter((r) => {
    const due = new Date(r.nextDueDate);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / 86400000;
    return diff >= 0 && diff <= 14;
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Net Worth" value={netWorth} color={netWorth >= 0 ? "green" : "red"} />
        <StatCard title="Total Assets" value={assets} color="blue" />
        <StatCard title="Total Liabilities" value={liabilities} color="red" />
        <StatCard title="This Month Spending" value={monthSpend} color="purple" />
      </div>

      {/* Cash flow chart + spending breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashflow} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {spending.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No spending data</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={spending} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {spending.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {spending.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {s.emoji} {s.name}
                      </span>
                      <span className="font-medium">{formatCurrency(s.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals + upcoming bills + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goals */}
        <Card>
          <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {goals.slice(0, 4).length === 0 && <p className="text-sm text-gray-400">No goals yet.</p>}
            {goals.slice(0, 4).map((g) => {
              const pct = clampPercent((g.currentAmount / g.targetAmount) * 100);
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{GOAL_ICONS[g.type]} {g.name}</span>
                    <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>{formatCurrency(g.currentAmount)}</span>
                    <span>{formatCurrency(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card>
          <CardHeader><CardTitle>Upcoming Bills (14 days)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingBills.length === 0 && <p className="text-sm text-gray-400">No upcoming bills.</p>}
            {upcomingBills.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.merchant}</p>
                  <p className="text-xs text-gray-400">{formatShortDate(r.nextDueDate)}</p>
                </div>
                <Badge variant="secondary">{formatCurrency(r.amount)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {transactions.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium truncate max-w-[140px]">{t.merchant}</p>
                  <p className="text-xs text-gray-400">{t.category?.name ?? "Uncategorized"}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === "CREDIT" ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}>
                  {t.type === "CREDIT" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    </div>
  );
}
