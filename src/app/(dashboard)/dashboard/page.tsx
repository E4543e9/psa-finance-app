"use client";

import { useEffect, useState } from "react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronRight, X, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardData {
  summary: { totalIncome: number; totalExpense: number; netBalance: number; totalDebt: number };
  monthlyData: { month: string; income: number; expense: number }[];
  donutData: { name: string; value: number; color: string; icon: string }[];
  recentTransactions: any[];
}
interface Bill { id: string; name: string; amount: string; dueDay: number; category: { icon: string | null } }
interface Goal { id: string; name: string; emoji: string; targetAmount: string; savedAmount: string; color: string; deadline: string | null }

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
function thaiMonth(d = new Date()) { return THAI_MONTHS[d.getMonth()]; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "อรุณสวัสดิ์" : h < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  async function fetchAll() {
    setLoading(true);
    const [dashRes, billsRes, goalsRes] = await Promise.all([
      fetch("/api/dashboard/summary"),
      fetch("/api/bills/pending"),
      fetch("/api/savings-goals"),
    ]);
    const [dash, billsData, goalsData] = await Promise.all([
      dashRes.json(), billsRes.json(), goalsRes.json(),
    ]);
    setData(dash);
    setBills(Array.isArray(billsData) ? billsData.slice(0, 3) : []);
    setGoals(Array.isArray(goalsData) ? goalsData : []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const net = data?.summary.netBalance ?? 0;
  const income = data?.summary.totalIncome ?? 0;
  const expense = data?.summary.totalExpense ?? 0;
  const spentPct = income > 0 ? Math.round((expense / income) * 100) : 0;
  const donut = data?.donutData ?? [];
  const totalDonut = donut.reduce((s, d) => s + d.value, 0);
  const monthly = data?.monthlyData ?? [];
  const momPct = (() => {
    if (monthly.length < 2) return 0;
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const lastNet = last.income - last.expense;
    const prevNet = prev.income - prev.expense;
    if (!prevNet) return 0;
    return Math.round(((lastNet - prevNet) / Math.abs(prevNet)) * 100);
  })();
  const firstName = session?.user?.name?.split(" ")[0] ?? "คุณ";
  const netK = Math.abs(net) >= 1000 ? `฿${(Math.abs(net) / 1000).toFixed(0)}k` : `฿${Math.abs(net).toFixed(0)}`;

  return (
    <>
      <div className="space-y-5 max-w-2xl mx-auto lg:max-w-none">

        {/* ── Greeting ── */}
        <div className="pt-1">
          <p className="text-sm text-muted-foreground">{greeting()}, {firstName} 👋</p>
          <h1 className="text-2xl font-extrabold leading-tight mt-0.5">
            เดือนนี้คุณ<br />
            <span style={{ color: "hsl(var(--primary))" }}>
              {net >= 0 ? "เก็บได้" : "ขาด"} {netK}
            </span>
          </h1>
        </div>

        {/* ── Hero balance card ── */}
        {loading ? (
          <Skeleton className="h-44 w-full rounded-2xl" />
        ) : (
          <div className="rounded-2xl p-5" style={{ background: "hsl(42 25% 91%)", color: "hsl(30 11% 8%)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold tracking-widest uppercase opacity-50">NET THIS MONTH</p>
              {momPct !== 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: momPct > 0 ? "hsl(142 60% 88%)" : "hsl(0 70% 90%)", color: momPct > 0 ? "hsl(142 50% 28%)" : "hsl(0 60% 38%)" }}>
                  {momPct > 0 ? "+" : ""}{momPct}% MoM
                </span>
              )}
            </div>
            <p className="text-4xl font-extrabold tracking-tight mb-4 mono"
              style={{ color: net < 0 ? "hsl(0 65% 42%)" : "hsl(30 11% 8%)" }}>
              ฿ {formatCurrency(Math.abs(net))}
            </p>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] opacity-50">Income vs Expense</span>
              <span className="text-[11px] font-semibold opacity-50">{spentPct}% spent</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "hsl(30 11% 8% / 0.12)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(spentPct, 100)}%`, background: "hsl(var(--primary))" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium mb-0.5 opacity-50">รายรับ</p>
                <p className="text-base font-extrabold mono">฿{formatCurrency(income)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium mb-0.5 opacity-50">รายจ่าย</p>
                <p className="text-base font-extrabold mono">฿{formatCurrency(expense)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── เป้าหมายการออม ── */}
        {(loading || goals.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">เป้าหมายการออม</h2>
              <Link href="/budget" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "hsl(var(--primary))" }}>
                ดูทั้งหมด <ChevronRight size={13} />
              </Link>
            </div>
            {loading ? (
              <div className="flex gap-3"><Skeleton className="h-36 w-44 flex-shrink-0 rounded-2xl" /><Skeleton className="h-36 w-44 flex-shrink-0 rounded-2xl" /></div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 scroll -mx-4 px-4">
                {goals.map((g) => {
                  const saved = parseFloat(g.savedAmount), target = parseFloat(g.targetAmount);
                  const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
                  return (
                    <Link key={g.id} href="/budget" className="flex-shrink-0 w-44 rounded-2xl p-4 flex flex-col justify-between"
                      style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: g.color + "33", color: g.color }}>{pct}%</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight mb-0.5">{g.name}</p>
                        <p className="text-xs opacity-50 mono">฿{(saved / 1000).toFixed(0)}k / ฿{(target / 1000).toFixed(0)}k</p>
                        <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: "hsl(var(--ink-card-fg) / 0.15)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── กำลังจะถึง ── */}
        {(loading || bills.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">กำลังจะถึง</h2>
              <Link href="/bills" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "hsl(var(--primary))" }}>
                จัดการ <ChevronRight size={13} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : (
                <div className="divide-y divide-border">
                  {bills.map((b) => {
                    const due = new Date(new Date().getFullYear(), new Date().getMonth(), b.dueDay);
                    return (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base bg-muted">
                          {b.category.icon ?? "📄"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.dueDay} {thaiMonth(due)}.</p>
                        </div>
                        <span className="text-sm font-extrabold mono">฿{formatCurrency(parseFloat(b.amount))}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── รายจ่ายตามหมวด ── */}
        {(loading || donut.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">รายจ่ายตามหมวด</h2>
              <span className="text-xs text-muted-foreground">{thaiMonth()} {new Date().getFullYear() + 543}</span>
            </div>
            {loading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex h-2.5 rounded-full overflow-hidden gap-px mb-4">
                  {donut.map((d, i) => (
                    <div key={i} style={{ width: `${totalDonut > 0 ? (d.value / totalDonut) * 100 : 0}%`, background: d.color }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {donut.slice(0, 6).map((d, i) => (
                    <div key={i} className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs truncate">{d.icon} {d.name}</span>
                      </div>
                      <span className="text-xs font-semibold mono ml-1 flex-shrink-0">
                        ฿{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ธุรกรรมล่าสุด ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">ธุรกรรมล่าสุด</h2>
            <Link href="/transactions" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "hsl(var(--primary))" }}>
              ดูทั้งหมด <ChevronRight size={13} />
            </Link>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1"><Skeleton className="h-3.5 w-32 mb-1.5" /><Skeleton className="h-3 w-20" /></div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : !(data?.recentTransactions?.length) ? (
              <p className="text-center text-muted-foreground text-sm py-10">ยังไม่มีรายการ</p>
            ) : (
              <div className="divide-y divide-border">
                {data.recentTransactions.slice(0, 6).map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: t.category?.color ? `${t.category.color}22` : "hsl(var(--muted))" }}>
                      {t.category?.icon ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.description}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.paidTo ?? t.category?.name} · {formatDate(t.date)}
                      </p>
                    </div>
                    <span className={cn("text-sm font-bold flex-shrink-0 mono", t.type === "INCOME" ? "text-positive" : "text-negative")}>
                      {t.type === "INCOME" ? "+" : "-"}฿{formatCurrency(parseFloat(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* quick add FAB */}
        <div className="fixed bottom-28 right-4 lg:bottom-8 lg:right-8 z-40 flex flex-col items-end gap-2">
          <button onClick={() => { setFormType("INCOME"); setShowForm(true); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold shadow-lg"
            style={{ background: "hsl(var(--positive))", color: "#fff" }}>
            <Plus size={14} strokeWidth={2.5} /> รายรับ
          </button>
          <button onClick={() => { setFormType("EXPENSE"); setShowForm(true); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold shadow-lg"
            style={{ background: "hsl(var(--negative))", color: "#fff" }}>
            <Plus size={14} strokeWidth={2.5} /> รายจ่าย
          </button>
        </div>

      </div>

      {/* ── Transaction modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-0 sm:border">
            <CardContent className="pt-5 pb-8 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-base font-semibold", formType === "INCOME" ? "text-positive" : "text-negative")}>
                  {formType === "INCOME" ? "+ เพิ่มรายรับ" : "− เพิ่มรายจ่าย"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X size={18} />
                </button>
              </div>
              <TransactionForm
                initial={{ type: formType }}
                onSuccess={() => { setShowForm(false); fetchAll(); }}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
