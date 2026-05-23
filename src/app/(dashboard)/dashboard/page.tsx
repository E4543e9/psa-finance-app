"use client";

import { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { BarChartMonthly } from "@/components/dashboard/BarChartMonthly";
import { DonutChartExpense } from "@/components/dashboard/DonutChartExpense";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BillChecklist } from "@/components/dashboard/BillChecklist";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">ภาพรวมการเงินเดือนนี้</p>
      </div>

      <SummaryCards data={data?.summary} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BarChartMonthly data={data?.monthlyData} loading={loading} />
        </div>
        <div>
          <BillChecklist />
        </div>
      </div>

      <DonutChartExpense data={data?.donutData} loading={loading} />

      <RecentTransactions data={data?.recentTransactions} loading={loading} />
    </div>
  );
}
