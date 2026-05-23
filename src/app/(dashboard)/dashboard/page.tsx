"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BillChecklist } from "@/components/dashboard/BillChecklist";
import { BarChartMonthly } from "@/components/dashboard/BarChartMonthly";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalDebt: number;
  };
  monthlyData: { month: string; income: number; expense: number }[];
  donutData: { name: string; value: number; color: string; icon: string }[];
  recentTransactions: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const net = data?.summary.netBalance ?? 0;
  const income = data?.summary.totalIncome ?? 0;
  const expense = data?.summary.totalExpense ?? 0;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const donut = data?.donutData ?? [];
  const totalDonut = donut.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">

      {/* ── Hero balance card ── */}
      {loading ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <div className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a56db 0%, #0e9f6e 100%)" }}>
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />

          <p className="text-sm font-semibold text-white/80 mb-1">ยอดสุทธิเดือนนี้</p>
          <p className={cn(
            "text-4xl font-extrabold tracking-tight mb-5",
            net < 0 && "text-red-200"
          )}>
            {net < 0 ? "-" : ""}{formatCurrency(Math.abs(net))}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">รายรับ</p>
                <p className="text-base font-bold">{formatCurrency(income)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingDown size={15} />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">รายจ่าย</p>
                <p className="text-base font-bold">{formatCurrency(expense)}</p>
              </div>
            </div>
          </div>

          {income > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <p className="text-xs text-white/70">อัตราออมเดือนนี้</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }}
                  />
                </div>
                <p className={cn("text-xs font-bold", savingsRate >= 20 ? "text-green-200" : "text-yellow-200")}>
                  {savingsRate}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Donut + Categories ── */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">รายจ่ายตามหมวดหมู่</h2>
          <span className="text-xs text-muted-foreground">เดือนนี้</span>
        </div>

        {loading ? (
          <div className="flex gap-4 items-center">
            <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
            </div>
          </div>
        ) : donut.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">ยังไม่มีรายจ่ายเดือนนี้</p>
        ) : (
          <div className="flex gap-4 items-center">
            {/* Donut */}
            <div className="flex-shrink-0 relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] text-muted-foreground font-medium">รวม</p>
                <p className="text-xs font-extrabold leading-tight">
                  ฿{(totalDonut / 1000).toFixed(1)}k
                </p>
              </div>
            </div>

            {/* Category list */}
            <div className="flex-1 space-y-2 min-w-0">
              {donut.slice(0, 5).map((cat, i) => {
                const pct = totalDonut > 0 ? Math.round((cat.value / totalDonut) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-semibold truncate">{cat.icon} {cat.name}</span>
                        <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0 w-16 text-right">
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bill Checklist + Debt summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BillChecklist />

        {/* Debt quick card */}
        {loading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : (data?.summary.totalDebt ?? 0) > 0 ? (
          <Link href="/debts"
            className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:bg-muted/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0 text-2xl">
              💳
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">หนี้คงเหลือรวม</p>
              <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                {formatCurrency(data?.summary.totalDebt ?? 0)}
              </p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
          </Link>
        ) : null}
      </div>

      {/* ── Bar chart 12 months ── */}
      <BarChartMonthly data={data?.monthlyData} loading={loading} />

      {/* ── Recent transactions ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-bold text-sm">ธุรกรรมล่าสุด</h2>
          <Link href="/transactions" className="text-xs text-primary font-semibold flex items-center gap-1">
            ดูทั้งหมด <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="px-4 pb-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-32 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !(data?.recentTransactions?.length) ? (
          <p className="text-center text-muted-foreground text-sm py-10">ยังไม่มีรายการ</p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentTransactions.slice(0, 8).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: t.category?.color ? `${t.category.color}22` : "#6b728022" }}>
                  {t.category?.icon ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category?.name} · {formatDate(t.date)}
                  </p>
                </div>
                <span className={cn(
                  "text-sm font-extrabold flex-shrink-0",
                  t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                )}>
                  {t.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
