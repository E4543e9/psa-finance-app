"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";

interface PendingBill {
  id: string;
  name: string;
  amount: string;
  dueDay: number;
  isVariable: boolean;
  category: { name: string; icon: string | null } | null;
}

export function BillChecklist() {
  const [bills, setBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  // variable bill prompt state
  const [varBill, setVarBill] = useState<PendingBill | null>(null);
  const [varAmount, setVarAmount] = useState("");

  async function fetchPending() {
    try {
      const res = await fetch("/api/bills/pending");
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPending(); }, []);

  async function markPaid(bill: PendingBill, amount: number) {
    setPaying(bill.id);
    const month = format(new Date(), "yyyy-MM");
    try {
      const res = await fetch(`/api/bills/${bill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          amount,
          status: "PAID",
          paidDate: format(new Date(), "yyyy-MM-dd"),
          note: "",
        }),
      });
      if (res.ok) {
        toast.success(`จ่าย "${bill.name}" แล้ว`);
        setBills((prev) => prev.filter((b) => b.id !== bill.id));
      } else {
        toast.error("เกิดข้อผิดพลาด");
      }
    } finally {
      setPaying(null);
    }
  }

  function handleClick(bill: PendingBill) {
    if (bill.isVariable) {
      setVarBill(bill);
      setVarAmount("");
    } else {
      markPaid(bill, parseFloat(bill.amount));
    }
  }

  async function handleVarConfirm() {
    if (!varBill) return;
    const amt = parseFloat(varAmount);
    if (!amt || amt <= 0) { toast.error("กรอกยอดให้ถูกต้อง"); return; }
    setVarBill(null);
    await markPaid(varBill, amt);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">ค่าใช้จ่ายประจำ — รอชำระ</CardTitle>
          {bills.length > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              {bills.length} รายการ
            </span>
          )}
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <CheckCircle2 size={32} className="text-green-500" />
              <p className="text-sm font-semibold">จ่ายครบแล้วเดือนนี้ 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bills.map((bill) => (
                <button
                  key={bill.id}
                  onClick={() => handleClick(bill)}
                  disabled={paying === bill.id}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border hover:bg-muted/60 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 text-muted-foreground group-hover:text-green-500 transition-colors">
                    <Circle size={20} className={paying === bill.id ? "animate-pulse" : ""} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.category?.icon} {bill.category?.name} · ครบ วันที่ {bill.dueDay}
                      {bill.isVariable && <span className="ml-1 text-blue-500">· กรอกยอดเอง</span>}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-red-500 flex-shrink-0">
                    {bill.isVariable ? "ยืดหยุ่น" : formatCurrency(parseFloat(bill.amount))}
                  </div>
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">
                กดรายการเพื่อทำเครื่องหมายว่าจ่ายแล้ว
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variable amount prompt */}
      {varBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xs">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="font-bold text-sm">{varBill.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">กรอกยอดที่จ่ายจริงเดือนนี้</p>
              </div>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={varAmount}
                onChange={(e) => setVarAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setVarBill(null)} className="flex-1">ยกเลิก</Button>
                <Button onClick={handleVarConfirm} className="flex-1">ยืนยัน</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
