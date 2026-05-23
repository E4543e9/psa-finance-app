"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtSchema, debtPaymentSchema, type DebtInput, type DebtPaymentInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, calcRemainingMonths } from "@/lib/utils";
import { Plus, CreditCard, Landmark, Users, HelpCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const DEBT_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: "บัตรเครดิต",
  LOAN: "สินเชื่อ",
  BORROW_FROM_PERSON: "ยืมบุคคล",
  OTHER: "อื่นๆ",
};

const DEBT_TYPE_ICONS: Record<string, any> = {
  CREDIT_CARD: CreditCard,
  LOAN: Landmark,
  BORROW_FROM_PERSON: Users,
  OTHER: HelpCircle,
};

interface Debt {
  id: string;
  name: string;
  creditor: string;
  totalAmount: string;
  remainingAmount: string;
  interestRate: string;
  monthlyPayment: string;
  dueDate: string | null;
  status: "ACTIVE" | "PAID";
  type: string;
  payments: { id: string; amount: string; paymentDate: string; note: string | null }[];
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/debts");
    const data = await res.json();
    setDebts(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  const activeDebts = debts.filter((d) => d.status === "ACTIVE");
  const paidDebts = debts.filter((d) => d.status === "PAID");
  const totalRemaining = activeDebts.reduce((s, d) => s + parseFloat(d.remainingAmount), 0);
  const totalOriginal = activeDebts.reduce((s, d) => s + parseFloat(d.totalAmount), 0);
  const totalPaid = totalOriginal - totalRemaining;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight hidden lg:block">หนี้สิน</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeDebts.length} รายการที่ยังค้างอยู่</p>
        </div>
        <Button size="sm" onClick={() => setShowAddDebt(true)}>
          <Plus size={16} /> เพิ่มหนี้
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "หนี้รวม", value: totalOriginal, color: "text-foreground", border: "border-l-4 border-l-orange-500" },
          { label: "จ่ายไปแล้ว", value: totalPaid, color: "text-green-600 dark:text-green-400", border: "border-l-4 border-l-green-500" },
          { label: "คงเหลือ", value: totalRemaining, color: "text-red-600 dark:text-red-400", border: "border-l-4 border-l-red-500" },
        ].map((s) => (
          <Card key={s.label} className={s.border}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-xl font-extrabold ${s.color}`}>{formatCurrency(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debt cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : activeDebts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีหนี้คงค้าง 🎉
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeDebts.map((debt) => {
            const total = parseFloat(debt.totalAmount);
            const remaining = parseFloat(debt.remainingAmount);
            const paid = total - remaining;
            const paidPct = Math.round((paid / total) * 100);
            const Icon = DEBT_TYPE_ICONS[debt.type] ?? HelpCircle;
            const monthsLeft = calcRemainingMonths(
              remaining,
              parseFloat(debt.monthlyPayment),
              parseFloat(debt.interestRate)
            );
            const daysUntilDue = debt.dueDate
              ? differenceInDays(new Date(debt.dueDate), new Date())
              : null;

            return (
              <Card key={debt.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon size={18} className="text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{debt.name}</h3>
                          {daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertCircle size={10} /> ครบ {daysUntilDue}วัน
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{debt.creditor} · {DEBT_TYPE_LABELS[debt.type]}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPayingDebt(debt)}>
                      บันทึกชำระ
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">จ่ายไปแล้ว {paidPct}%</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        คงเหลือ {formatCurrency(remaining)}
                      </span>
                    </div>
                    <Progress value={paidPct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>รวม {formatCurrency(total)}</span>
                      <span>
                        {parseFloat(debt.monthlyPayment) > 0 && `~${monthsLeft} เดือน`}
                        {debt.dueDate && ` · ครบ ${formatDate(debt.dueDate)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paid debts */}
      {paidDebts.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">ชำระแล้ว ({paidDebts.length})</h2>
          <div className="space-y-2">
            {paidDebts.map((d) => (
              <Card key={d.id} className="opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <p className="font-medium text-sm">{d.name}</p>
                  <Badge variant="success">{formatCurrency(parseFloat(d.totalAmount))}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddDebt && <AddDebtModal onSuccess={() => { setShowAddDebt(false); fetchDebts(); }} onCancel={() => setShowAddDebt(false)} />}

      {/* Payment Modal */}
      {payingDebt && <PaymentModal debt={payingDebt} onSuccess={() => { setPayingDebt(null); fetchDebts(); }} onCancel={() => setPayingDebt(null)} />}
    </div>
  );
}

function AddDebtModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DebtInput>({
    resolver: zodResolver(debtSchema),
    defaultValues: { interestRate: 0, status: "ACTIVE" } as any,
  });

  async function onSubmit(data: DebtInput) {
    setLoading(true);
    const res = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success("เพิ่มหนี้สำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-4">
        <CardHeader><CardTitle>เพิ่มหนี้ใหม่</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ชื่อหนี้</label>
                <input {...register("name")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="เช่น บัตรกรุงไทย" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">เจ้าหนี้</label>
                <input {...register("creditor")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ธนาคาร/บุคคล" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ประเภท</label>
                <select {...register("type")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="CREDIT_CARD">บัตรเครดิต</option>
                  <option value="LOAN">สินเชื่อ</option>
                  <option value="BORROW_FROM_PERSON">ยืมบุคคล</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ยอดรวม (฿)</label>
                <input {...register("totalAmount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                {errors.totalAmount && <p className="text-xs text-destructive mt-1">{errors.totalAmount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ยอดคงเหลือ (฿)</label>
                <input {...register("remainingAmount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ดอกเบี้ย (%/ปี)</label>
                <input {...register("interestRate")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ผ่อน/เดือน (฿)</label>
                <input {...register("monthlyPayment")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">วันครบกำหนด</label>
                <input {...register("dueDate")} type="date" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "กำลังบันทึก..." : "เพิ่มหนี้"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentModal({ debt, onSuccess, onCancel }: { debt: Debt; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DebtPaymentInput>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      amount: parseFloat(debt.monthlyPayment) || undefined,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(data: DebtPaymentInput) {
    setLoading(true);
    const res = await fetch(`/api/debts/${debt.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success("บันทึกการชำระสำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>บันทึกการชำระ — {debt.name}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">คงเหลือ {formatCurrency(parseFloat(debt.remainingAmount))}</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">จำนวนเงิน (฿)</label>
              <input {...register("amount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">วันที่ชำระ</label>
              <input {...register("paymentDate")} type="date" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <input {...register("note")} type="text" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
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
