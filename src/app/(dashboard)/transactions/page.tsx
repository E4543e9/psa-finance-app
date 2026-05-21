"use client";

import { useEffect, useState, useCallback } from "react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  date: string;
  note: string | null;
  categoryId: string;
  category: { id: string; name: string; icon: string | null; color: string | null };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);

    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [page, search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  function handleExportCSV() {
    const header = "วันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน,หมายเหตุ";
    const rows = transactions.map((t) =>
      [
        formatDate(t.date),
        t.type === "INCOME" ? "รายรับ" : "รายจ่าย",
        t.category.name,
        `"${t.description}"`,
        t.amount,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">รายรับ-รายจ่าย</h1>
          <p className="text-sm text-muted-foreground mt-1">ทั้งหมด {total} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4">
                {editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
              </h2>
              <TransactionForm
                initial={editing}
                onSuccess={() => { setShowForm(false); setEditing(null); fetchData(); }}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหารายการ..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
        >
          <option value="">ทุกประเภท</option>
          <option value="INCOME">รายรับ</option>
          <option value="EXPENSE">รายจ่าย</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">ไม่มีรายการ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="text-left p-4">วันที่</th>
                    <th className="text-left p-4">รายละเอียด</th>
                    <th className="text-left p-4">หมวดหมู่</th>
                    <th className="text-left p-4">ประเภท</th>
                    <th className="text-right p-4">จำนวนเงิน</th>
                    <th className="text-right p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="p-4 text-sm font-medium max-w-48 truncate">
                        {t.description}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="flex items-center gap-1">
                          {t.category.icon} {t.category.name}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                          {t.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                        </Badge>
                      </td>
                      <td className={`p-4 text-sm font-semibold text-right whitespace-nowrap ${
                        t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {t.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(t.amount))}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { setEditing(t); setShowForm(true); }}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            disabled={deleting === t.id}
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 size={15} className="text-destructive" />
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
