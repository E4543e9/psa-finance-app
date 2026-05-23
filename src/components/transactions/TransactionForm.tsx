"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
}

interface Props {
  initial?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initial
      ? {
          type: initial.type,
          amount: parseFloat(initial.amount),
          description: initial.description,
          date: format(new Date(initial.date), "yyyy-MM-dd"),
          categoryId: initial.categoryId,
          note: initial.note ?? "",
          paidTo: initial.paidTo ?? "",
        }
      : {
          type: "EXPENSE",
          date: format(new Date(), "yyyy-MM-dd"),
        },
  });

  const type = watch("type");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function onSubmit(data: TransactionInput) {
    setLoading(true);
    const url = initial ? `/api/transactions/${initial.id}` : "/api/transactions";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(initial ? "แก้ไขรายการสำเร็จ" : "เพิ่มรายการสำเร็จ");
      onSuccess();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["INCOME", "EXPENSE"] as const).map((t) => (
          <label
            key={t}
            className={`flex items-center justify-center py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
              type === t
                ? t === "INCOME"
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-red-500 text-white border-red-500"
                : "border-border hover:bg-muted"
            }`}
          >
            <input {...register("type")} type="radio" value={t} className="hidden" />
            {t === "INCOME" ? "รายรับ" : "รายจ่าย"}
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">จำนวนเงิน (฿)</label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          placeholder="0.00"
        />
        {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">รายละเอียด</label>
        <input
          {...register("description")}
          type="text"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          placeholder="เช่น ค่าอาหารกลางวัน"
        />
        {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">วันที่</label>
          <input
            {...register("date")}
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          />
          {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
          <select
            {...register("categoryId")}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          >
            <option value="">-- เลือก --</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {type === "INCOME" ? "รับจาก (ไม่บังคับ)" : "จ่ายให้ (ไม่บังคับ)"}
        </label>
        <input
          {...register("paidTo")}
          type="text"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
          placeholder={type === "INCOME" ? "เช่น ลูกค้า / บริษัท" : "เช่น EARTH / ร้านอาหาร"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">หมายเหตุ (ไม่บังคับ)</label>
        <textarea
          {...register("note")}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "กำลังบันทึก..." : initial ? "แก้ไข" : "เพิ่ม"}
        </Button>
      </div>
    </form>
  );
}
