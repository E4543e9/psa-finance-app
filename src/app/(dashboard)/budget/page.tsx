"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema, type BudgetInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: string;
  month: string;
  spent: number;
  category: { id: string; name: string; icon: string | null; color: string | null };
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      fetch(`/api/budget?month=${month}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setBudgets(b);
    setCategories(c.filter((c: Category) => c.type === "EXPENSE"));
    setLoading(false);
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">งบประมาณ</h1>
          <p className="text-sm text-muted-foreground mt-1">{getMonthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> ตั้งงบ
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "งบรวม", value: totalBudget, color: "text-foreground" },
          { label: "ใช้ไปแล้ว", value: totalSpent, color: "text-red-600 dark:text-red-400" },
          { label: "คงเหลือ", value: totalBudget - totalSpent, color: totalBudget - totalSpent < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{formatCurrency(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่ได้ตั้งงบประมาณเดือนนี้ — กด "ตั้งงบ" เพื่อเริ่ม
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const budget = parseFloat(b.amount);
            const pct = budget > 0 ? Math.round((b.spent / budget) * 100) : 0;
            const over = b.spent > budget;
            const warn = pct >= 80 && !over;

            return (
              <Card key={b.id} className={cn(over && "border-destructive/50")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>{b.category.icon}</span>
                      <span className="font-medium text-sm">{b.category.name}</span>
                      {over && (
                        <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertTriangle size={12} /> เกินงบ
                        </span>
                      )}
                      {warn && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          <AlertTriangle size={12} /> ใกล้เต็ม
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(b.spent)} / {formatCurrency(budget)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={cn("h-2", over && "[&>div]:bg-destructive", warn && "[&>div]:bg-yellow-500")}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{pct}% ของงบ</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <AddBudgetModal
          categories={categories}
          month={month}
          existingCategoryIds={budgets.map((b) => b.categoryId)}
          onSuccess={() => { setShowForm(false); fetchData(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function AddBudgetModal({ categories, month, existingCategoryIds, onSuccess, onCancel }: {
  categories: Category[];
  month: string;
  existingCategoryIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const available = categories.filter((c) => !existingCategoryIds.includes(c.id));

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { month },
  });

  async function onSubmit(data: BudgetInput) {
    setLoading(true);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success("บันทึกงบสำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>ตั้งงบประมาณ</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register("month")} type="hidden" />
            <div>
              <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
              <select {...register("categoryId")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                <option value="">-- เลือก --</option>
                {(available.length > 0 ? available : categories).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">งบประมาณ (฿)</label>
              <input {...register("amount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
