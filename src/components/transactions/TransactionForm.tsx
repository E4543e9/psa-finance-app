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

interface GroupUser {
  id: string;
  userId: string;
  name: string;
  groupName: string;
}

interface Props {
  initial?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [enableSplit, setEnableSplit] = useState(!!initial?.splitWith);
  const [selectedUser, setSelectedUser] = useState<GroupUser | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initial?.type ?? "EXPENSE",
      amount: initial?.amount ? parseFloat(initial.amount) : undefined,
      description: initial?.description ?? "",
      date: initial?.date ? format(new Date(initial.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      categoryId: initial?.categoryId ?? "",
      note: initial?.note ?? "",
      paidTo: initial?.paidTo ?? "",
      splitWith: initial?.splitWith ?? "",
      splitAmount: initial?.splitAmount ? parseFloat(initial.splitAmount) : undefined,
    },
  });

  const type = watch("type");
  const amount = watch("amount");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/users").then((r) => r.json()).then(setGroupUsers).catch(() => {});
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSplitToggle(checked: boolean) {
    setEnableSplit(checked);
    if (!checked) {
      setValue("splitWith", "");
      setValue("splitAmount", undefined);
      setSelectedUser(null);
    }
  }

  function handleSelectUser(u: GroupUser | null) {
    setSelectedUser(u);
    if (u) {
      setValue("splitWith", u.name);
    } else {
      setValue("splitWith", "");
    }
  }

  async function onSubmit(data: TransactionInput) {
    setLoading(true);
    const payload = {
      ...data,
      splitWith: enableSplit ? data.splitWith : "",
      splitAmount: enableSplit ? data.splitAmount : undefined,
      splitWithUserId: enableSplit && selectedUser ? selectedUser.id : null,
    };

    const url = initial ? `/api/transactions/${initial.id}` : "/api/transactions";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const txn = await res.json();
      // If split with a group user → create a SplitRequest
      if (enableSplit && selectedUser && data.splitAmount) {
        await fetch("/api/split-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toUserId: selectedUser.id,
            amount: data.splitAmount,
            description: data.description,
            transactionId: txn.id,
          }),
        });
      }
      toast.success(initial ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ");
      onSuccess();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type */}
      <div className="grid grid-cols-2 gap-2">
        {(["INCOME", "EXPENSE"] as const).map((t) => (
          <label key={t} className={`flex items-center justify-center py-2.5 rounded-lg border cursor-pointer text-sm font-semibold transition-colors ${
            type === t
              ? t === "INCOME" ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500"
              : "border-border hover:bg-muted"
          }`}>
            <input {...register("type")} type="radio" value={t} className="hidden" />
            {t === "INCOME" ? "รายรับ" : "รายจ่าย"}
          </label>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">จำนวนเงิน (฿)</label>
        <input {...register("amount")} type="number" step="0.01" className={inputClass} placeholder="0.00" />
        {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">รายละเอียด</label>
        <input {...register("description")} type="text" className={inputClass} placeholder="เช่น ค่าอาหารกลางวัน" />
        {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Date + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">วันที่</label>
          <input {...register("date")} type="date" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมวดหมู่</label>
          <select {...register("categoryId")} className={inputClass}>
            <option value="">-- เลือก --</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>
      </div>

      {/* Paid to */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          {type === "INCOME" ? "รับจาก" : "จ่ายให้"} (ไม่บังคับ)
        </label>
        <input {...register("paidTo")} type="text" className={inputClass}
          placeholder={type === "INCOME" ? "เช่น บริษัท / ลูกค้า" : "เช่น ร้านอาหาร"} />
      </div>

      {/* Split section */}
      <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className={`w-9 h-5 rounded-full transition-colors relative ${enableSplit ? "bg-primary" : "bg-border"}`}
            onClick={() => handleSplitToggle(!enableSplit)}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enableSplit ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm font-semibold">
            {type === "INCOME" ? "แบ่งให้อีกฝ่าย" : "แบ่งจ่ายกับอีกฝ่าย"}
          </span>
        </label>

        {enableSplit && (
          <div className="space-y-3 pt-1">
            {/* User picker from group */}
            {groupUsers.length > 0 && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">เลือกจากกลุ่ม</label>
                <div className="flex flex-wrap gap-2">
                  {groupUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(selectedUser?.id === u.id ? null : u)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedUser?.id === u.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </span>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  {type === "INCOME" ? "โอนให้" : "รับคืนจาก"}
                </label>
                <input {...register("splitWith")} type="text" className={inputClass}
                  placeholder={groupUsers.length > 0 ? "หรือพิมพ์ชื่อ" : "เช่น EARTH"} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  ยอด (฿)
                  {amount > 0 && (
                    <button type="button" className="ml-1 text-primary text-xs underline"
                      onClick={() => setValue("splitAmount", Number((amount / 2).toFixed(2)))}>
                      ÷2 = {(amount / 2).toFixed(0)}
                    </button>
                  )}
                </label>
                <input {...register("splitAmount")} type="number" step="0.01" className={inputClass} placeholder="0.00" />
              </div>
            </div>

            {selectedUser && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ระบบจะส่งคำขออนุมัติให้ {selectedUser.name} โดยอัตโนมัติ
              </p>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมายเหตุ</label>
        <textarea {...register("note")} rows={2}
          className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">ยกเลิก</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "กำลังบันทึก..." : initial ? "บันทึก" : "เพิ่ม"}
        </Button>
      </div>
    </form>
  );
}
