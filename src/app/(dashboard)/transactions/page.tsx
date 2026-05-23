"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Download, CheckCircle2, Split, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  date: string;
  note: string | null;
  paidTo: string | null;
  splitWith: string | null;
  splitAmount: string | null;
  splitStatus: string | null;
  categoryId: string;
  category: { id: string; name: string; icon: string | null; color: string | null };
}

// colors สำหรับ category ที่ไม่มี color
const FALLBACK_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // all-page data สำหรับ chart (ดึงแบบไม่มี pagination)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);

    // fetch paginated (for table) + all EXPENSE for chart
    const [pageRes, allRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch(`/api/transactions?page=1&limit=500${typeFilter ? `&type=${typeFilter}` : ""}${search ? `&search=${search}` : ""}`),
    ]);
    const pageData = await pageRes.json();
    const allData = await allRes.json();

    setTransactions(pageData.transactions ?? []);
    setTotal(pageData.total ?? 0);
    setPages(pageData.pages ?? 1);
    setAllTransactions(allData.transactions ?? []);
    setLoading(false);
  }, [page, search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // คำนวณ category breakdown จาก allTransactions
  const categoryChart = useMemo(() => {
    const expenses = allTransactions.filter((t) => t.type === "EXPENSE");
    const map: Record<string, { name: string; icon: string; color: string; value: number }> = {};
    expenses.forEach((t) => {
      const key = t.categoryId;
      if (!map[key]) {
        map[key] = {
          name: t.category.name,
          icon: t.category.icon ?? "📦",
          color: t.category.color ?? FALLBACK_COLORS[Object.keys(map).length % FALLBACK_COLORS.length],
          value: 0,
        };
      }
      map[key].value += parseFloat(t.amount);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [allTransactions]);

  const incomeChart = useMemo(() => {
    const incomes = allTransactions.filter((t) => t.type === "INCOME");
    const map: Record<string, { name: string; icon: string; color: string; value: number }> = {};
    incomes.forEach((t) => {
      const key = t.categoryId;
      if (!map[key]) {
        map[key] = {
          name: t.category.name,
          icon: t.category.icon ?? "📦",
          color: t.category.color ?? FALLBACK_COLORS[Object.keys(map).length % FALLBACK_COLORS.length],
          value: 0,
        };
      }
      map[key].value += parseFloat(t.amount);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [allTransactions]);

  const totalExpense = categoryChart.reduce((s, c) => s + c.value, 0);
  const totalIncome = incomeChart.reduce((s, c) => s + c.value, 0);

  async function handleDelete(id: string) {
    if (!confirm("ลบรายการนี้?")) return;
    setDeleting(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("ลบรายการสำเร็จ");
      fetchData();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
    setDeleting(null);
  }

  async function handleConfirmSplit(id: string) {
    setConfirming(id);
    const res = await fetch(`/api/transactions/${id}/confirm`, { method: "PATCH" });
    if (res.ok) {
      toast.success("ยืนยันแล้ว");
      fetchData();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
    setConfirming(null);
  }

  function handleExportCSV() {
    const header = "วันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน,จ่ายให้,แบ่งกับ,ยอดแบ่ง,สถานะแบ่ง,หมายเหตุ";
    const rows = transactions.map((t) =>
      [
        formatDate(t.date),
        t.type === "INCOME" ? "รายรับ" : "รายจ่าย",
        t.category.name,
        `"${t.description}"`,
        t.amount,
        t.paidTo ?? "",
        t.splitWith ?? "",
        t.splitAmount ?? "",
        t.splitStatus ?? "",
        `"${t.note ?? ""}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const pendingCount = transactions.filter((t) => t.splitStatus === "PENDING").length;
  const showChart = !typeFilter || typeFilter === "EXPENSE" ? categoryChart : incomeChart;
  const showTotal = !typeFilter || typeFilter === "EXPENSE" ? totalExpense : totalIncome;
  const chartLabel = !typeFilter
    ? "รายจ่ายตามหมวด"
    : typeFilter === "EXPENSE" ? "รายจ่ายตามหมวด" : "รายรับตามหมวด";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">รายรับ-รายจ่าย</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">ทั้งหมด {total} รายการ</p>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                <Split size={11} />
                {pendingCount} รอยืนยัน
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="hidden sm:flex">
            <Download size={16} /> CSV
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> เพิ่ม
          </Button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-0 sm:border">
            <CardContent className="pt-5 pb-8 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">{editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h2>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X size={18} />
                </button>
              </div>
              <TransactionForm
                initial={editing}
                onSuccess={() => { setShowForm(false); setEditing(null); fetchData(); }}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Category donut chart ── */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-bold mb-3">{chartLabel}</p>
          {loading ? (
            <div className="flex gap-4 items-center">
              <Skeleton className="w-28 h-28 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7 w-full rounded-lg" />)}
              </div>
            </div>
          ) : showChart.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">ไม่มีข้อมูล</p>
          ) : (
            <div className="flex gap-4 items-center">
              {/* Donut */}
              <div className="flex-shrink-0 relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={showChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {showChart.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] text-muted-foreground">รวม</p>
                  <p className="text-[11px] font-extrabold leading-tight">
                    ฿{showTotal >= 1000 ? `${(showTotal / 1000).toFixed(1)}k` : showTotal.toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Category bars */}
              <div className="flex-1 space-y-1.5 min-w-0">
                {showChart.slice(0, 6).map((cat, i) => {
                  const pct = showTotal > 0 ? Math.round((cat.value / showTotal) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm flex-shrink-0 w-5 text-center">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold truncate">{cat.name}</span>
                          <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">{pct}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0 w-14 text-right">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหา..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[
            { value: "", label: "ทั้งหมด" },
            { value: "INCOME", label: "รายรับ" },
            { value: "EXPENSE", label: "รายจ่าย" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTypeFilter(opt.value); setPage(1); }}
              className={cn(
                "px-3 py-2 text-sm font-semibold transition-colors",
                typeFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">ไม่มีรายการ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    <th className="text-left p-4">วันที่</th>
                    <th className="text-left p-4">รายละเอียด</th>
                    <th className="text-left p-4 hidden sm:table-cell">หมวดหมู่</th>
                    <th className="text-left p-4 hidden md:table-cell">ประเภท</th>
                    <th className="text-right p-4">จำนวนเงิน</th>
                    <th className="text-left p-4 hidden lg:table-cell">แบ่งจ่าย</th>
                    <th className="text-right p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="p-4 text-sm font-semibold max-w-40">
                        <div className="truncate">{t.description}</div>
                        {t.paidTo && (
                          <div className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                            → {t.paidTo}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          {t.category.icon} {t.category.name}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                          {t.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                        </Badge>
                      </td>
                      <td className={cn(
                        "p-4 text-sm font-extrabold text-right whitespace-nowrap",
                        t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      )}>
                        {t.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(t.amount))}
                      </td>
                      {/* Split */}
                      <td className="p-4 text-sm hidden lg:table-cell">
                        {t.splitWith ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Split size={11} />
                              <span>{t.splitWith}</span>
                              {t.splitAmount && (
                                <span className="font-medium text-foreground">
                                  {formatCurrency(parseFloat(t.splitAmount))}
                                </span>
                              )}
                            </div>
                            {t.splitStatus === "PENDING" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2 text-amber-600 border-amber-300"
                                disabled={confirming === t.id}
                                onClick={() => handleConfirmSplit(t.id)}
                              >
                                <CheckCircle2 size={11} />
                                {confirming === t.id ? "..." : "ยืนยัน"}
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 size={11} /> ยืนยันแล้ว
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon"
                            onClick={() => { setEditing(t); setShowForm(true); }}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon"
                            disabled={deleting === t.id}
                            onClick={() => handleDelete(t.id)}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            ก่อนหน้า
          </Button>
          <span className="text-sm text-muted-foreground">หน้า {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
