"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BillChecklist } from "@/components/dashboard/BillChecklist";
import { BarChartMonthly } from "@/components/dashboard/BarChartMonthly";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowRight, Plus, X } from "lucide-react";

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
  const [showForm, setShowForm] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  async function fetchDashboard() {
    const d = await fetch("/api/dashboard/summary").then((r) => r.json());
    setData(d);
    setLoading(false);
  }

  useEffect(() => { fetchDashboard(); }, []);

  const net = data?.summary.netBalance ?? 0;
  const income = data?.summary.totalIncome ?? 0;
  const expense = data?.summary.totalExpense ?? 0;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const donut = data?.donutData ?? [];
  const totalDonut = donut.reduce((s, d) => s + d.value, 0);

  return (
    <>
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">

      {/* ── Hero balance card ── */}
      {loading ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}
        >
          {/* decorative glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: "hsl(var(--primary) / 0.12)", filter: "blur(40px)" }} />

          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ink-card-fg) / 0.5)" }}>ยอดสุทธิเดือนนี้</p>
          <p className={cn(
            "text-4xl font-semibold tracking-tight mb-5 mono",
            net < 0 && "text-negative"
          )}>
            {net < 0 ? "-" : ""}฿{formatCurrency(Math.abs(net))}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--positive) / 0.2)" }}>
                <TrendingUp size={15} style={{ color: "hsl(var(--positive))" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--ink-card-fg) / 0.5)" }}>รายรับ</p>
                <p className="text-sm font-semibold mono">{formatCurrency(income)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--negative) / 0.2)" }}>
                <TrendingDown size={15} style={{ color: "hsl(var(--negative))" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--ink-card-fg) / 0.5)" }}>รายจ่าย</p>
                <p className="text-sm font-semibold mono">{formatCurrency(expense)}</p>
              </div>
            </div>
          </div>

          {income > 0 && (
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid hsl(var(--ink-card-fg) / 0.12)" }}>
              <p className="text-xs" style={{ color: "hsl(var(--ink-card-fg) / 0.5)" }}>อัตราออมเดือนนี้</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "hsl(var(--ink-card-fg) / 0.15)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%`, background: "hsl(var(--primary))" }}
                  />
                </div>
                <p className="text-xs font-semibold mono" style={{ color: savingsRate >= 20 ? "hsl(var(--positive))" : "hsl(var(--primary))" }}>
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
          <h2 className="font-semibold text-sm">รายจ่ายตามหมวดหมู่</h2>
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
                  "text-sm font-semibold flex-shrink-0 mono",
                  t.type === "INCOME" ? "text-positive" : "text-negative"
                )}>
                  {t.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>

      {/* ── Speed dial backdrop ── */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* ── Speed dial FAB ── */}
      <div className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 flex flex-col items-end gap-3">
        {/* Sub-actions */}
        <div className={cn(
          "flex flex-col items-end gap-2 transition-all duration-200",
          fabOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          {/* รายรับ */}
          <button
            onClick={() => { setFormType("INCOME"); setShowForm(true); setFabOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            style={{ background: "hsl(var(--positive))", color: "#fff" }}
          >
            <TrendingUp size={16} strokeWidth={2.5} />
            + รายรับ
          </button>
          {/* รายจ่าย */}
          <button
            onClick={() => { setFormType("EXPENSE"); setShowForm(true); setFabOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            style={{ background: "hsl(var(--negative))", color: "#fff" }}
          >
            <TrendingDown size={16} strokeWidth={2.5} />
            − รายจ่าย
          </button>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setFabOpen((o) => !o)}
          className={cn(
            "w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-200",
            fabOpen ? "rotate-45 scale-95" : "rotate-0 scale-100 hover:scale-105 active:scale-95"
          )}
          aria-label="เพิ่มรายการ"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Transaction modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-0 sm:border">
            <CardContent className="pt-5 pb-8 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "text-base font-semibold",
                  formType === "INCOME" ? "text-positive" : "text-negative"
                )}>
                  {formType === "INCOME" ? "+ เพิ่มรายรับ" : "− เพิ่มรายจ่าย"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <TransactionForm
                initial={{ type: formType }}
                onSuccess={() => { setShowForm(false); setLoading(true); fetchDashboard(); }}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
