"use client";

import { useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getMonthLabel } from "@/lib/utils";
import { format, subMonths, startOfMonth } from "date-fns";

interface ReportData {
  monthlyData: { month: string; income: number; expense: number }[];
  topCategories: { name: string; amount: number; color: string; icon: string }[];
  summary: { totalIncome: number; totalExpense: number; netBalance: number };
}

function toMonthValue(date: Date) {
  return format(date, "yyyy-MM");
}

export default function ReportsPage() {
  const [from, setFrom] = useState(toMonthValue(subMonths(new Date(), 5)));
  const [to, setTo] = useState(toMonthValue(new Date()));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?from=${from}-01&to=${to}-01`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight hidden lg:block">รายงาน</h1>
        <p className="text-sm text-muted-foreground mt-1">วิเคราะห์รายรับรายจ่าย</p>
      </div>

      {/* Date range picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">จาก</label>
              <input
                type="month"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">ถึง</label>
              <input
                type="month"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? "กำลังโหลด..." : "ดูรายงาน"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!data && !loading && (
        <div className="text-center text-muted-foreground py-12">
          เลือกช่วงเวลาแล้วกด "ดูรายงาน"
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "รายรับรวม", value: data.summary.totalIncome, color: "text-green-600 dark:text-green-400", border: "border-l-4 border-l-green-500" },
              { label: "รายจ่ายรวม", value: data.summary.totalExpense, color: "text-red-600 dark:text-red-400", border: "border-l-4 border-l-red-500" },
              {
                label: "ยอดสุทธิ",
                value: data.summary.netBalance,
                color: data.summary.netBalance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
                border: data.summary.netBalance >= 0 ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-red-500",
              },
            ].map((s) => (
              <Card key={s.label} className={s.border}>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-xl font-extrabold ${s.color}`}>฿{formatCurrency(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Line chart trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">แนวโน้มรายเดือน</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `฿${formatCurrency(v)}`} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" name="รายรับ" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 expense categories */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top 5 หมวดหมู่รายจ่าย</CardTitle></CardHeader>
            <CardContent>
              {data.topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">ไม่มีข้อมูล</p>
              ) : (
                <div className="space-y-3">
                  {data.topCategories.map((c, i) => {
                    const maxAmt = data.topCategories[0].amount;
                    const pct = Math.round((c.amount / maxAmt) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">{c.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground">฿{formatCurrency(c.amount)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: c.color }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
