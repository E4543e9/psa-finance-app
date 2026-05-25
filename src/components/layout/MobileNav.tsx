"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Plus, PiggyBank, Bell, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; }

const mainNav = [
  { href: "/dashboard",    label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/transactions", label: "รายการ",   icon: ArrowLeftRight },
  { href: "ADD",           label: "",          icon: Plus },
  { href: "/budget",       label: "ออม",      icon: PiggyBank },
  { href: "/notifications",label: "แจ้งเตือน", icon: Bell },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  // ─ form state ─
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState("");
  const [desc, setDesc] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // ─ notification count ─
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const [nRes, sRes] = await Promise.all([
          fetch("/api/notifications"),
          fetch("/api/split-requests"),
        ]);
        let count = 0;
        if (nRes.ok) { const d = await nRes.json(); count += d.pendingSplits ?? 0; }
        if (sRes.ok) { const d = await sRes.json(); count += (d.incoming ?? []).filter((r: any) => r.status === "PENDING").length; }
        setNotifCount(count);
      } catch { /* ignore */ }
    }
    fetchCount();
    const t = setInterval(fetchCount, 60_000);
    return () => clearInterval(t);
  }, []);

  const openModal = useCallback(() => {
    setType("EXPENSE");
    setAmount("");
    setCatId("");
    setDesc("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (showModal && categories.length === 0) {
      fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
    }
  }, [showModal, categories.length]);

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) { toast.error("ระบุจำนวนเงิน"); return; }
    if (!catId) { toast.error("เลือกหมวดหมู่"); return; }
    if (!desc.trim()) { toast.error("ระบุรายการ"); return; }
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: parseFloat(amount), categoryId: catId, description: desc, note: note || null, date }),
    });
    if (res.ok) {
      toast.success("บันทึกแล้ว 🎉");
      setShowModal(false);
      router.refresh();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
    setSaving(false);
  }

  const cats = categories.filter((c) => c.type === type);

  return (
    <>
      {/* ── Tab bar ── */}
      <nav className="fixed bottom-7 left-3.5 right-3.5 z-40 lg:hidden">
        <div
          className="h-16 rounded-[22px] grid grid-cols-5 items-center px-1"
          style={{ background: "hsl(var(--ink-card))", boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}
        >
          {mainNav.map((item) => {
            if (item.href === "ADD") {
              return (
                <button key="add" onClick={openModal} className="flex items-center justify-center">
                  <span
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
                    style={{ background: "hsl(var(--primary))", color: "#fff", boxShadow: "0 4px 18px hsl(var(--primary) / 0.5)" }}
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </span>
                </button>
              );
            }

            const Icon = item.icon;
            const active = pathname === item.href;
            const isNotif = item.href === "/notifications";

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 relative"
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.6}
                    style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--ink-card-fg) / 0.5)" }}
                  />
                  {isNotif && notifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: "hsl(var(--primary))", color: "#fff" }}>
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </div>
                <span
                  className="text-[9px] font-semibold leading-none"
                  style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--ink-card-fg) / 0.4)" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Quick-add bottom sheet ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Sheet */}
          <div
            className="relative rounded-t-3xl px-5 pt-4 pb-12 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            style={{ background: "hsl(var(--background))" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">เพิ่มรายการ</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-2xl p-1" style={{ background: "hsl(var(--muted))" }}>
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button key={t} onClick={() => { setType(t); setCatId(""); }}
                  className={cn("flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                    type === t ? "shadow-sm" : "opacity-50")}
                  style={type === t ? {
                    background: "hsl(var(--background))",
                    color: t === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))",
                  } : {}}>
                  {t === "EXPENSE" ? "− รายจ่าย" : "+ รายรับ"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="flex items-center justify-center gap-2 py-1">
              <span className="text-3xl font-light text-muted-foreground">฿</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="text-5xl font-extrabold w-48 text-center bg-transparent outline-none mono"
                style={{ color: type === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))" }}
              />
            </div>

            {/* Categories */}
            {cats.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">หมวด</p>
                <div className="grid grid-cols-5 gap-2">
                  {cats.map((c) => (
                    <button key={c.id} onClick={() => setCatId(c.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95"
                      style={catId === c.id ? {
                        background: type === "EXPENSE" ? "hsl(var(--negative) / 0.15)" : "hsl(var(--positive) / 0.15)",
                        border: `2px solid ${type === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))"}`,
                      } : { background: "hsl(var(--muted))", border: "2px solid transparent" }}>
                      <span className="text-xl">{c.icon ?? "📦"}</span>
                      <span className="leading-tight text-center font-medium" style={{ fontSize: "10px" }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description + note + date */}
            <div className="space-y-2">
              <input value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="รายการ / ร้านค้า"
                className="w-full px-4 py-3 rounded-2xl bg-muted text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40" />
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="โน้ต (เลือกใส่)"
                  className="flex-1 px-4 py-3 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-3 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-1"
              style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}>
              <Check size={18} strokeWidth={2.5} />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
