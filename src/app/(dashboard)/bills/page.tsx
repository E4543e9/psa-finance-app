"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  monthlyBillSchema, billPaymentSchema,
  type MonthlyBillInput, type BillPaymentInput,
} from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, RefreshCw, ChevronLeft, ChevronRight, User } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, parseISO } from "date-fns";

interface Category { id: string; name: string; icon: string | null; type: string; }

interface BillItem {
  id: string;
  name: string;
  amount: string;
  dueDay: number;
  paidTo: string | null;
  note: string | null;
  category: { name: string; icon: string | null; color: string | null };
  payment: {
    id: string; amount: string; status: string;
    paidDate: string; note: string | null;
  } | null;
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [showAddBill, setShowAddBill] = useState(false);
  const [payingBill, setPayingBill] = useState<BillItem | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/bills?month=${month}`);
    const data = await res.json();
    setBills(data);
    setLoading(false);
  }, [month]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const paid = bills.filter((b) => b.payment?.status === "PAID");
  const waitingRefund = bills.filter((b) => b.payment?.status === "WAITING_REFUND");
  const unpaid = bills.filter((b) => !b.payment);
  const totalBudget = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalPaid = [...paid, ...waitingRefund].reduce((s, b) => s + parseFloat(b.amount), 0);

  function prevMonth() { setMonth(format(subMonths(parseISO(`${month}-01`), 1), "yyyy-MM")); }
  function nextMonth() { setMonth(format(addMonths(parseISO(`${month}-01`), 1), "yyyy-MM")); }

  async function handleUnpay(bill: BillItem) {
    if (!confirm("ยกเลิกการชำระรายการนี้?")) return;
    const res = await fetch(`/api/bills/${bill.id}/pay?month=${month}`, { method: "DELETE" });
    if (res.ok) { toast.success("ยกเลิกการชำระแล้ว"); fetchBills(); }
    else toast.error("เกิดข้อผิดพลาด");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">บิลรายเดือน</h1>
          <p className="text-sm text-muted-foreground mt-1">สิ่งที่ต้องจ่ายประจำ</p>
        </div>
        <Button size="sm" onClick={() => setShowAddBill(true)}>
          <Plus size={16} /> เพิ่มบิล
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-semibold min-w-32 text-center">{getMonthLabel(month)}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">งบรวม</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">จ่ายแล้ว</p>
            <p className="text-lg font-bold mt-1 text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ค้างอยู่</p>
            <p className="text-lg font-bold mt-1 text-red-600 dark:text-red-400">{formatCurrency(totalBudget - totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {bills.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">จ่ายแล้ว {paid.length + waitingRefund.length}/{bills.length} บิล</span>
              <span className="font-medium">{Math.round((totalPaid / totalBudget) * 100) || 0}%</span>
            </div>
            <Progress value={totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Bill list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีบิล — กด "เพิ่มบิล" เพื่อเริ่ม
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const isPaid = bill.payment?.status === "PAID";
            const isWaiting = bill.payment?.status === "WAITING_REFUND";
            const isUnpaid = !bill.payment;

            return (
              <Card key={bill.id} className={isPaid ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
                      {bill.category.icon ?? "📋"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{bill.name}</span>
                        {isWaiting && (
                          <Badge variant="warning" className="text-xs flex items-center gap-1">
                            <RefreshCw size={10} /> รอขึ้นเงิน
                          </Badge>
                        )}
                        {isPaid && (
                          <Badge variant="success" className="text-xs">จ่ายแล้ว</Badge>
                        )}
                        {isUnpaid && (
                          <Badge variant="outline" className="text-xs">รอจ่าย</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span>ครบวันที่ {bill.dueDay}</span>
                        <span>·</span>
                        <span>{bill.category.name}</span>
                        {bill.paidTo && (
                          <>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <User size={10} /> {bill.paidTo}
                            </span>
                          </>
                        )}
                        {bill.payment && (
                          <>
                            <span>·</span>
                            <span>{formatDate(bill.payment.paidDate)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold">{formatCurrency(parseFloat(bill.amount))}</span>

                      {isUnpaid ? (
                        <Button
                          size="sm"
                          onClick={() => setPayingBill(bill)}
                          className="h-8 text-xs"
                        >
                          <CheckCircle2 size={14} /> ยืนยันชำระ
                        </Button>
                      ) : (
                        <button
                          onClick={() => handleUnpay(bill)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddBill && (
        <AddBillModal
          onSuccess={() => { setShowAddBill(false); fetchBills(); }}
          onCancel={() => setShowAddBill(false)}
        />
      )}
      {payingBill && (
        <ConfirmPaymentModal
          bill={payingBill}
          month={month}
          onSuccess={() => { setPayingBill(null); fetchBills(); }}
          onCancel={() => setPayingBill(null)}
        />
      )}
    </div>
  );
}

function AddBillModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) =>
      setCategories(d.filter((c: Category) => c.type === "EXPENSE"))
    );
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<MonthlyBillInput>({
    resolver: zodResolver(monthlyBillSchema),
  });

  async function onSubmit(data: MonthlyBillInput) {
    setLoading(true);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success("เพิ่มบิลสำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>เพิ่มบิลรายเดือน</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อบิล</label>
              <input {...register("name")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="เช่น Netflix, ค่าน้ำ" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ยอดเงิน (฿)</label>
                <input {...register("amount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ครบวันที่</label>
                <input {...register("dueDay")} type="number" min="1" max="31" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="1-31" />
                {errors.dueDay && <p className="text-xs text-destructive mt-1">{errors.dueDay.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <select {...register("categoryId")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                  <option value="">-- เลือก --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">จ่ายให้ (ไม่บังคับ)</label>
                <input {...register("paidTo")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="เช่น EARTH" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <input {...register("note")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "กำลังบันทึก..." : "เพิ่มบิล"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmPaymentModal({
  bill, month, onSuccess, onCancel,
}: { bill: BillItem; month: string; onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BillPaymentInput>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: {
      amount: parseFloat(bill.amount),
      month,
      status: "PAID",
      paidDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(data: BillPaymentInput) {
    setLoading(true);
    const res = await fetch(`/api/bills/${bill.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast.success("ยืนยันการชำระสำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">ยืนยันการชำระ</CardTitle>
          <p className="text-sm text-muted-foreground">{bill.name}{bill.paidTo && ` → ${bill.paidTo}`}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register("month")} type="hidden" />

            <div>
              <label className="block text-sm font-medium mb-1">จำนวนเงิน (฿)</label>
              <input {...register("amount")} type="number" step="0.01" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">วันที่จ่าย</label>
              <input {...register("paidDate")} type="date" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">สถานะ</label>
              <select {...register("status")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                <option value="PAID">✓ จ่ายแล้ว</option>
                <option value="WAITING_REFUND">↺ รอขึ้นเงิน</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <input {...register("note")} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "กำลังบันทึก..." : "ยืนยันชำระ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
