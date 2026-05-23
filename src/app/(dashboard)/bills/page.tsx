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
import { Plus, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, getYear, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { th } from "date-fns/locale";

interface Category { id: string; name: string; icon: string | null; type: string; }

interface BillItem {
  id: string; name: string; amount: string; dueDay: number;
  isVariable: boolean; frequency: string;
  paidTo: string | null; note: string | null;
  category: { name: string; icon: string | null; color: string | null };
  payment: { id: string; amount: string; status: string; paidDate: string; note: string | null } | null;
}

type ViewMode = "month" | "week" | "year";

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [view, setView] = useState<ViewMode>("month");
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

  // Weekly filter
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weeklyBills = bills.filter((b) => {
    const due = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]) - 1, b.dueDay);
    return due >= weekStart && due <= weekEnd;
  });

  // Year summary
  const currentYear = getYear(today);
  const monthsOfYear = eachMonthOfInterval({
    start: startOfYear(new Date(currentYear, 0)),
    end: endOfYear(new Date(currentYear, 0)),
  });

  // Per-day cost
  const daysInMonth = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
  const dailyCost = totalBudget / daysInMonth;
  const weeklyCost = totalBudget / 4.33;

  function prevMonth() { setMonth(format(subMonths(parseISO(`${month}-01`), 1), "yyyy-MM")); }
  function nextMonth() { setMonth(format(addMonths(parseISO(`${month}-01`), 1), "yyyy-MM")); }

  async function handleUnpay(bill: BillItem) {
    if (!confirm("ยกเลิกการชำระ?")) return;
    const res = await fetch(`/api/bills/${bill.id}/pay?month=${month}`, { method: "DELETE" });
    if (res.ok) { toast.success("ยกเลิกแล้ว"); fetchBills(); }
    else toast.error("เกิดข้อผิดพลาด");
  }

  const displayBills = view === "week" ? weeklyBills : bills;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">ค่าใช้จ่ายประจำ</h1>
          <p className="text-sm text-muted-foreground mt-1">รายจ่ายรายเดือน/รายสัปดาห์/รายปี</p>
        </div>
        <Button size="sm" onClick={() => setShowAddBill(true)}>
          <Plus size={15} /> เพิ่มรายการ
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(["month", "week", "year"] as ViewMode[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === v ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "month" ? "รายเดือน" : v === "week" ? "รายสัปดาห์" : "รายปี"}
          </button>
        ))}
      </div>

      {/* YEAR VIEW */}
      {view === "year" ? (
        <div className="space-y-4">
          <h2 className="font-semibold">สรุปรายปี {currentYear}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {monthsOfYear.map((m) => {
              const mStr = format(m, "yyyy-MM");
              const isPast = m <= today;
              const isCurrent = mStr === getCurrentMonth();
              return (
                <button key={mStr} onClick={() => { setView("month"); setMonth(mStr); }}
                  className={`p-4 rounded-xl border text-left transition-colors hover:border-primary ${
                    isCurrent ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                  <p className="text-sm font-semibold">{format(m, "MMMM", { locale: th })}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalBudget)}/เดือน</p>
                  {isPast && !isCurrent && (
                    <Badge variant="outline" className="text-xs mt-2">ผ่านไปแล้ว</Badge>
                  )}
                  {isCurrent && <Badge className="text-xs mt-2">เดือนนี้</Badge>}
                </button>
              );
            })}
          </div>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-3">สรุปประมาณการทั้งปี {currentYear}</p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget * 12)}</p>
                  <p className="text-xs text-muted-foreground mt-1">รายจ่ายประจำรวม/ปี</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                  <p className="text-xs text-muted-foreground mt-1">เฉลี่ย/เดือน</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(dailyCost)}</p>
                  <p className="text-xs text-muted-foreground mt-1">เฉลี่ย/วัน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Month navigator */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold">{getMonthLabel(month)}</p>
              {view === "week" && (
                <p className="text-xs text-muted-foreground">
                  {format(weekStart, "d MMM", { locale: th })} — {format(weekEnd, "d MMM yyyy", { locale: th })}
                </p>
              )}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "งบรวม/เดือน", value: formatCurrency(totalBudget), sub: null },
              { label: "จ่ายแล้ว", value: formatCurrency(totalPaid), sub: `${paid.length + waitingRefund.length}/${bills.length} รายการ` },
              { label: "ค้างอยู่", value: formatCurrency(totalBudget - totalPaid), sub: `${unpaid.length} รายการ` },
              { label: "เฉลี่ย/วัน", value: formatCurrency(dailyCost), sub: `${formatCurrency(weeklyCost)}/สัปดาห์` },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                  {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress */}
          {bills.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">ความคืบหน้า</span>
                <span className="font-bold">{Math.round(totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0)}%</span>
              </div>
              <Progress value={totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0} className="h-2.5" />
            </div>
          )}

          {/* Bill list */}
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : displayBills.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              {view === "week" ? "ไม่มีบิลครบกำหนดสัปดาห์นี้" : "ยังไม่มีรายการ"}
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {/* Unpaid first */}
              {unpaid.filter(b => displayBills.includes(b)).length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">รอชำระ</p>
              )}
              {displayBills.filter(b => !b.payment).map((bill) => (
                <BillCard key={bill.id} bill={bill} onPay={() => setPayingBill(bill)} onUnpay={() => handleUnpay(bill)} />
              ))}
              {displayBills.filter(b => b.payment).length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">ชำระแล้ว</p>
              )}
              {displayBills.filter(b => b.payment).map((bill) => (
                <BillCard key={bill.id} bill={bill} onPay={() => setPayingBill(bill)} onUnpay={() => handleUnpay(bill)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddBill && (
        <AddBillModal onSuccess={() => { setShowAddBill(false); fetchBills(); }} onCancel={() => setShowAddBill(false)} />
      )}
      {payingBill && (
        <ConfirmPaymentModal bill={payingBill} month={month}
          onSuccess={() => { setPayingBill(null); fetchBills(); }} onCancel={() => setPayingBill(null)} />
      )}
    </div>
  );
}

function BillCard({ bill, onPay, onUnpay }: { bill: BillItem; onPay: () => void; onUnpay: () => void }) {
  const isPaid = bill.payment?.status === "PAID";
  const isWaiting = bill.payment?.status === "WAITING_REFUND";

  return (
    <Card className={isPaid ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-xl w-9 text-center flex-shrink-0">{bill.category.icon ?? "📋"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{bill.name}</span>
              {bill.isVariable && <Badge variant="outline" className="text-xs">ยอดแปรผัน</Badge>}
              {isWaiting && <Badge variant="warning" className="text-xs"><RefreshCw size={9} /> รอขึ้นเงิน</Badge>}
              {isPaid && <Badge variant="success" className="text-xs">จ่ายแล้ว</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
              <span>วันที่ {bill.dueDay}</span>
              <span>·</span>
              <span>{bill.category.name}</span>
              {bill.paidTo && <><span>→</span><span>{bill.paidTo}</span></>}
              {bill.payment && <><span>·</span><span>{formatDate(bill.payment.paidDate)}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold">{formatCurrency(parseFloat(bill.payment?.amount ?? bill.amount))}</p>
              {bill.payment && bill.payment.amount !== bill.amount && (
                <p className="text-xs text-muted-foreground line-through">{formatCurrency(parseFloat(bill.amount))}</p>
              )}
            </div>
            {!bill.payment ? (
              <Button size="sm" onClick={onPay} className="h-8 text-xs">
                <CheckCircle2 size={13} /> ชำระ
              </Button>
            ) : (
              <button onClick={onUnpay} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                ยกเลิก
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddBillModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isVariable, setIsVariable] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<MonthlyBillInput>({
    resolver: zodResolver(monthlyBillSchema),
    defaultValues: { dueDay: 1 },
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) =>
      setCategories(d.filter((c: Category) => c.type === "EXPENSE"))
    );
  }, []);

  async function onSubmit(data: MonthlyBillInput) {
    setLoading(true);
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, isVariable }),
    });
    if (res.ok) { toast.success("เพิ่มสำเร็จ"); onSuccess(); }
    else toast.error("เกิดข้อผิดพลาด");
    setLoading(false);
  }

  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>เพิ่มรายจ่ายประจำ</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">ชื่อรายการ</label>
              <input {...register("name")} className={inputClass} placeholder="เช่น Netflix, ค่าน้ำ, ค่าผ่อนรถ" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            {/* Variable toggle */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border">
              <div className={`w-9 h-5 rounded-full transition-colors relative ${isVariable ? "bg-primary" : "bg-border"}`}
                onClick={() => setIsVariable(!isVariable)}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVariable ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">ยอดแปรผัน</p>
                <p className="text-xs text-muted-foreground">กรอกยอดจริงทุกครั้งที่ชำระ เช่น ค่าน้ำ ค่าไฟ</p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {isVariable ? "ยอดประมาณการ (฿)" : "ยอดคงที่ (฿)"}
                </label>
                <input {...register("amount")} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">ครบกำหนดวันที่</label>
                <input {...register("dueDay")} type="number" min="1" max="31" className={inputClass} placeholder="1–31" />
                {errors.dueDay && <p className="text-xs text-destructive mt-1">{errors.dueDay.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมวดหมู่</label>
                <select {...register("categoryId")} className={inputClass}>
                  <option value="">-- เลือก --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">จ่ายให้</label>
                <input {...register("paidTo")} className={inputClass} placeholder="เช่น EARTH" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมายเหตุ</label>
              <input {...register("note")} className={inputClass} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "กำลังบันทึก..." : "เพิ่ม"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmPaymentModal({ bill, month, onSuccess, onCancel }: { bill: BillItem; month: string; onSuccess: () => void; onCancel: () => void }) {
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

  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

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
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                จำนวนเงิน (฿) {bill.isVariable && <span className="text-amber-500 font-normal">· ยอดแปรผัน กรอกยอดจริง</span>}
              </label>
              <input {...register("amount")} type="number" step="0.01" className={inputClass} />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">วันที่จ่าย</label>
              <input {...register("paidDate")} type="date" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">สถานะ</label>
              <select {...register("status")} className={inputClass}>
                <option value="PAID">จ่ายแล้ว</option>
                <option value="WAITING_REFUND">รอขึ้นเงิน</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมายเหตุ</label>
              <input {...register("note")} className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "กำลังบันทึก..." : "ยืนยัน"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
