"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Search, X, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  date: string;
  note: string | null;
  paidTo: string | null;
  splitWith: string | null;
  splitAmount: string | null;
  splitStatus: string | null;
  categoryId: string;
  category: { id: string; name: string; icon: string | null; color: string | null };
}

interface Category {
  id: string; name: string; icon: string | null; type: string;
}

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const THAI_DAYS = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."];

function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  const dayName = THAI_DAYS[d.getDay()];
  return `${day} ${month} · ${dayName}`;
}

function groupByDate(txs: Transaction[]) {
  const map: Record<string, Transaction[]> = {};
  for (const t of txs) {
    const key = t.date.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(t);
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

// ─── Add/Edit Modal ───────────────────────────────────────────
function TransactionModal({
  initial, categories, onSuccess, onClose,
}: {
  initial?: Partial<Transaction> | null;
  categories: Category[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isEdit = !!initial?.id;
  const [type, setType] = useState<"EXPENSE" | "INCOME">(initial?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(initial?.amount ? Math.round(parseFloat(initial.amount)).toString() : "");
  const [catId, setCatId] = useState(initial?.categoryId ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const cats = categories.filter((c) => c.type === type);

  async function handleSubmit() {
    if (!amount || !catId || !desc) { toast.error("กรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    const body = { type, amount: parseFloat(amount), categoryId: catId, description: desc, note: note || null, date };
    const res = isEdit
      ? await fetch(`/api/transactions/${initial!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(isEdit ? "แก้ไขแล้ว" : "บันทึกแล้ว"); onSuccess(); } else { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: "hsl(var(--background))", boxShadow: "0 -20px 60px rgba(0,0,0,0.35)" }}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-muted mx-auto -mt-1" />

        {/* Type toggle */}
        <div className="flex rounded-2xl overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setCatId(""); }}
              className={cn("flex-1 py-2.5 text-sm font-bold transition-all rounded-2xl",
                type === t ? "shadow-sm" : "opacity-50")}
              style={type === t
                ? { background: "hsl(var(--background))", color: t === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))" }
                : {}}>
              {t === "EXPENSE" ? "− รายจ่าย" : "+ รายรับ"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">จำนวน</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-light text-muted-foreground">฿</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-4xl font-extrabold w-48 text-center bg-transparent outline-none mono"
              style={{ color: type === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))" }}
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">หมวด</p>
          <div className="grid grid-cols-5 gap-2">
            {cats.map((c) => (
              <button key={c.id} onClick={() => setCatId(c.id)}
                className={cn("flex flex-col items-center gap-1 p-2 rounded-2xl text-xs font-medium transition-all",
                  catId === c.id ? "ring-2" : "opacity-60 hover:opacity-100")}
                style={catId === c.id ? {
                  background: type === "EXPENSE" ? "hsl(var(--negative) / 0.15)" : "hsl(var(--positive) / 0.15)",
                  border: `2px solid ${type === "EXPENSE" ? "hsl(var(--negative))" : "hsl(var(--positive))"}`,
                } : { background: "hsl(var(--muted))", border: "2px solid transparent" }}>
                <span className="text-xl">{c.icon ?? "📦"}</span>
                <span className="leading-tight text-center" style={{ fontSize: "10px" }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description + Note + Date */}
        <div className="space-y-3">
          <input value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="รายการ / ร้านค้า"
            className="w-full px-4 py-3 rounded-2xl bg-muted text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="flex gap-3">
            <input value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="โน้ต (เลือกใส่)"
              className="flex-1 px-4 py-3 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-3 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSubmit} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}>
          <Check size={18} strokeWidth={2.5} />
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "EXPENSE" | "INCOME">("");
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", limit: "200" });
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    // Period filter
    const now = new Date();
    if (period === "week") {
      const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
      params.set("from", mon.toISOString().slice(0, 10));
    } else if (period === "month") {
      params.set("from", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
    } else if (period === "year") {
      params.set("from", `${now.getFullYear()}-01-01`);
    }

    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      categories.length === 0 ? fetch("/api/categories") : Promise.resolve(null),
    ]);
    const txData = await txRes.json();
    setTransactions(txData.transactions ?? []);
    if (catRes) { const catData = await catRes.json(); setCategories(catData ?? []); }
    setLoading(false);
  }, [search, typeFilter, period, categories.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalIncome = useMemo(() => transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0), [transactions]);
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);

  async function handleDelete(id: string) {
    if (!confirm("ลบรายการนี้?")) return;
    setDeleting(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("ลบแล้ว"); fetchData(); } else toast.error("เกิดข้อผิดพลาด");
    setDeleting(null);
  }

  // Date range label
  const now = new Date();
  const dateLabel = period === "week"
    ? `สัปดาห์นี้`
    : period === "month"
    ? `1 – ${now.getDate()} ${THAI_MONTHS[now.getMonth()]}. ${now.getFullYear() + 543}`
    : `ปี ${now.getFullYear() + 543}`;

  return (
    <>
      <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">

        {/* ── Header ── */}
        <div className="pt-1">
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
          <div className="flex items-baseline gap-4 mt-0.5">
            <span className="text-xl font-extrabold mono" style={{ color: "hsl(var(--positive))" }}>
              +฿{formatCurrency(totalIncome)}
            </span>
            <span className="text-xl font-extrabold mono" style={{ color: "hsl(var(--negative))" }}>
              −฿{formatCurrency(totalExpense)}
            </span>
          </div>
        </div>

        {/* ── Period filter tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-muted w-fit">
          {([["week","สัปดาห์"],["month","เดือน"],["year","ปี"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={cn("px-4 py-1.5 rounded-xl text-sm font-semibold transition-all",
                period === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); }}
            placeholder="ค้นหา ร้านค้า / รายการ"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/50" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Type filter chips ── */}
        <div className="flex gap-2">
          {([["","ทั้งหมด"],["EXPENSE","รายจ่าย"],["INCOME","รายรับ"]] as const).map(([v, label]) => {
            const cnt = v === "" ? transactions.length : transactions.filter((t) => t.type === v).length;
            return (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={cn("px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                  typeFilter === v
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground")}>
                {label} {cnt}
              </button>
            );
          })}
        </div>

        {/* ── Transaction groups ── */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-3 rounded-lg" />
                <div className="space-y-2">{[...Array(2)].map((_, j) => <Skeleton key={j} className="h-16 w-full rounded-2xl" />)}</div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16">ไม่มีรายการ</p>
        ) : (
          <div className="space-y-5">
            {grouped.map(([dateKey, txs]) => {
              const dayTotal = txs.reduce((s, t) => s + (t.type === "EXPENSE" ? -1 : 1) * parseFloat(t.amount), 0);
              return (
                <div key={dateKey}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-bold text-muted-foreground">{formatThaiDate(dateKey + "T00:00:00")}</p>
                    <p className={cn("text-xs font-bold mono", dayTotal >= 0 ? "text-positive" : "text-negative")}>
                      {dayTotal >= 0 ? "+" : ""}฿{formatCurrency(Math.abs(dayTotal))}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    {txs.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: t.category?.color ? `${t.category.color}22` : "hsl(var(--muted))" }}>
                          {t.category?.icon ?? "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{t.description}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.paidTo ?? t.category?.name}
                            {t.note ? ` · ${t.note}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn("text-sm font-bold mono", t.type === "INCOME" ? "text-positive" : "text-negative")}>
                            {t.type === "INCOME" ? "+" : "-"}฿{formatCurrency(parseFloat(t.amount))}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                            <button onClick={() => { setEditing(t); setShowModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <Pencil size={13} className="text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <Trash2 size={13} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit modal ── */}
      {showModal && (
        <TransactionModal
          initial={editing}
          categories={categories}
          onSuccess={() => { setShowModal(false); setEditing(null); fetchData(); }}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </>
  );
}
