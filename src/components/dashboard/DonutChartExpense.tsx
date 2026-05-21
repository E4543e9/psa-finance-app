"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface DonutChartExpenseProps {
  data?: CategoryData[];
  loading?: boolean;
}

export function DonutChartExpense({ data, loading }: DonutChartExpenseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายจ่ายตามหมวดหมู่</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data?.length ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            ไม่มีข้อมูลรายจ่าย
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
