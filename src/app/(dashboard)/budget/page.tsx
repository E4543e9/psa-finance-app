"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Plus, X, Zap, PiggyBank, Check, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Goal {
  id: string; name: string; emoji: string; color: string;
  targetAmount: string; savedAmount: string;
  deadline: string | null; weeklyTarget: string | null;
}

const PALETTE = ["#FF5B36","#4F8EF7","#34D399","#FBBF24","#A78BFA","#F472B6","#38BDF8","#FB923C"];
const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function weeksLeft(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(1, Math.ceil(diff / (7 * 864e5)));
}

function thaiDeadline(deadline: string | null) {
  if (!deadline) return null;
  const d = new Date(deadline);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}. ${d.getFullYear() + 543}`;
}

// ─── Goal Card ───────────────────────────────────────────────
function GoalCard({
  goal, isFeatured, onDeposit, onEdit, onDelete,
}: {
  goal: Goal; isFeatured: boolean;
  onDeposit: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const saved = parseFloat(goal.savedAmount);
  const target = parseFloat(goal.targetAmount);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const remaining = Math.max(0, target - saved);
  const wks = weeksLeft(goal.deadline);
  const weeklyNeeded = wks && remaining ? Math.ceil(remaining / wks) : null;

  const bg = isFeatured ? "hsl(42 25% 91%)" : "hsl(var(--ink-card))";
  const fg = isFeatured ? "hsl(30 11% 8%)" : "hsl(var(--ink-card-fg))";

  return (
    <div className="rounded-2xl p-5" style={{ background: bg, color: fg }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{goal.emoji}</span>
          <div>
            <p className="font-bold text-sm">{goal.name}</p>
            {goal.deadline && (
              <p className="text-xs opacity-50">ครบกำหนด {thaiDeadline(goal.deadline)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-xl opacity-50 hover:opacity-100 transition-opacity" style={{ background: "transparent" }}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-xl opacity-50 hover:opacity-100 transition-opacity">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* amounts */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs opacity-50 mb-0.5">SAVED</p>
          <p className="text-2xl font-extrabold mono">฿{formatCurrency(saved)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-50 mb-0.5">TO GO</p>
          <p className="text-lg font-bold mono opacity-80">฿{formatCurrency(remaining)}</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: isFeatured ? "hsl(30 11% 8% / 0.12)" : "hsl(var(--ink-card-fg) / 0.12)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: goal.color }} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] opacity-50">{pct}% ของเป้าหมาย</p>
        {goal.weeklyTarget && (
          <p className="text-[11px] font-semibold" style={{ color: goal.color }}>
            ฿{formatCurrency(parseFloat(goal.weeklyTarget))}/สัปดาห์
          </p>
        )}
      </div>

      {/* weekly estimate */}
      {wks && weeklyNeeded && (
        <p className="text-xs opacity-40 mb-4">ประมาณ {wks} สัปดาห์ที่เหลือ · ควรออม ฿{formatCurrency(weeklyNeeded)}/สัปดาห์</p>
      )}

      {/* actions */}
      <div className="flex gap-2">
        <button onClick={() => onDeposit(goal)}
          className="flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
          style={{ background: goal.color, color: "#fff" }}>
          <PiggyBank size={15} strokeWidth={2.5} /> เพิ่มเงิน
        </button>
        {isFeatured && wks && (
          <button onClick={() => onDeposit(goal)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.97]"
            style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}>
            <Zap size={14} strokeWidth={2.5} style={{ color: "#FBBF24" }} /> เร่งให้เร็วขึ้น
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Goal Modal ───────────────────────────────────────────────
function GoalModal({
  initial, onSuccess, onClose,
}: {
  initial?: Partial<Goal> | null;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🎯");
  const [color, setColor] = useState(initial?.color ?? PALETTE[0]);
  const [target, setTarget] = useState(initial?.targetAmount ? Math.round(parseFloat(initial.targetAmount)).toString() : "");
  const [saved, setSaved] = useState(initial?.savedAmount ? Math.round(parseFloat(initial.savedAmount)).toString() : "");
  const [weekly, setWeekly] = useState(initial?.weeklyTarget ? Math.round(parseFloat(initial.weeklyTarget)).toString() : "");
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name || !target) { toast.error("กรอกชื่อและจำนวนเป้าหมาย"); return; }
    setSaving(true);
    const body = { name, emoji, color, targetAmount: parseFloat(target), savedAmount: parseFloat(saved || "0"), weeklyTarget: weekly ? parseFloat(weekly) : null, deadline: deadline || null };
    const res = isEdit
      ? await fetch(`/api/savings-goals/${initial!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/savings-goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(isEdit ? "แก้ไขแล้ว" : "สร้างเป้าหมายแล้ว"); onSuccess(); } else toast.error("เกิดข้อผิดพลาด");
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
        style={{ background: "hsl(var(--background))", boxShadow: "0 -20px 60px rgba(0,0,0,0.35)" }}>
        <div className="w-10 h-1 rounded-full bg-muted mx-auto -mt-1" />
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{isEdit ? "แก้ไขเป้าหมาย" : "สร้างเป้าหมายใหม่"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={18} /></button>
        </div>

        {/* Emoji + Name */}
        <div className="flex gap-3">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
            className="w-16 h-14 rounded-2xl bg-muted text-2xl text-center outline-none" maxLength={2} />
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อเป้าหมาย เช่น ซื้อบ้าน"
            className="flex-1 px-4 rounded-2xl bg-muted text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">สี</p>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform active:scale-90"
                style={{ background: c, boxShadow: color === c ? `0 0 0 3px hsl(var(--background)), 0 0 0 5px ${c}` : "none" }} />
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">เป้าหมาย (฿)</p>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder="100,000"
              className="w-full px-4 py-3 rounded-2xl bg-muted text-sm outline-none mono focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">ออมไปแล้ว (฿)</p>
            <input type="number" value={saved} onChange={(e) => setSaved(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-2xl bg-muted text-sm outline-none mono focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">ออมต่อสัปดาห์ (฿)</p>
            <input type="number" value={weekly} onChange={(e) => setWeekly(e.target.value)}
              placeholder="เลือกใส่"
              className="w-full px-4 py-3 rounded-2xl bg-muted text-sm outline-none mono focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">ครบกำหนด</p>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "hsl(var(--ink-card))", color: "hsl(var(--ink-card-fg))" }}>
          <Check size={18} strokeWidth={2.5} />
          {saving ? "กำลังบันทึก..." : (isEdit ? "บันทึกการแก้ไข" : "สร้างเป้าหมาย")}
        </button>
      </div>
    </div>
  );
}

// ─── Deposit Modal ────────────────────────────────────────────
function DepositModal({ goal, onSuccess, onClose }: { goal: Goal; onSuccess: () => void; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  async function handleDeposit() {
    if (!amount || parseFloat(amount) <= 0) { toast.error("ระบุจำนวน"); return; }
    setSaving(true);
    const newSaved = parseFloat(goal.savedAmount) + parseFloat(amount);
    const res = await fetch(`/api/savings-goals/${goal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ savedAmount: newSaved }) });
    if (res.ok) { toast.success(`เพิ่มเงิน ฿${formatCurrency(parseFloat(amount))} แล้ว`); onSuccess(); } else toast.error("เกิดข้อผิดพลาด");
    setSaving(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        style={{ background: "hsl(var(--background))", boxShadow: "0 -20px 60px rgba(0,0,0,0.35)" }}>
        <div className="w-10 h-1 rounded-full bg-muted mx-auto -mt-1" />
        <div className="flex items-center gap-3">
          <span className="text-3xl">{goal.emoji}</span>
          <div>
            <p className="font-bold">{goal.name}</p>
            <p className="text-xs text-muted-foreground mono">฿{formatCurrency(parseFloat(goal.savedAmount))} / ฿{formatCurrency(parseFloat(goal.targetAmount))}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">เพิ่มเงินออม (฿)</p>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0" autoFocus
            className="text-4xl font-extrabold w-full text-center bg-transparent outline-none mono"
            style={{ color: goal.color }} />
        </div>
        <button onClick={handleDeposit} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: goal.color, color: "#fff" }}>
          <PiggyBank size={18} strokeWidth={2.5} />
          {saving ? "กำลังบันทึก..." : "เพิ่มเงิน"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function BudgetPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [depositing, setDepositing] = useState<Goal | null>(null);

  async function fetchGoals() {
    setLoading(true);
    const res = await fetch("/api/savings-goals");
    const data = await res.json();
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchGoals(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("ลบเป้าหมายนี้?")) return;
    const res = await fetch(`/api/savings-goals/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("ลบแล้ว"); fetchGoals(); } else toast.error("เกิดข้อผิดพลาด");
  }

  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.savedAmount), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0);
  const totalPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <>
      <div className="space-y-5 max-w-2xl mx-auto lg:max-w-none">

        {/* ── Header ── */}
        <div className="pt-1">
          <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
            TOTAL SAVED · {goals.length} GOAL{goals.length !== 1 ? "S" : ""}
          </p>
          {loading ? (
            <Skeleton className="h-10 w-40 mt-1 rounded-xl" />
          ) : (
            <>
              <p className="text-4xl font-extrabold mono tracking-tight mt-0.5">฿{formatCurrency(totalSaved)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                จาก ฿{formatCurrency(totalTarget)} · {totalPct}%
              </p>
            </>
          )}
        </div>

        {/* ── Multi-color progress ── */}
        {!loading && goals.length > 0 && (
          <div className="h-2.5 rounded-full overflow-hidden flex gap-px">
            {goals.map((g) => {
              const saved = parseFloat(g.savedAmount);
              const w = totalTarget > 0 ? (saved / totalTarget) * 100 : 0;
              return w > 0 ? (
                <div key={g.id} style={{ width: `${w}%`, background: g.color }} className="transition-all duration-500" />
              ) : null;
            })}
            {/* remaining */}
            {totalSaved < totalTarget && (
              <div style={{ flex: 1, background: "hsl(var(--muted))" }} />
            )}
          </div>
        )}

        {/* ── Goal cards ── */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-semibold text-muted-foreground">ยังไม่มีเป้าหมาย</p>
            <p className="text-sm text-muted-foreground mt-1">กด + เพื่อสร้างเป้าหมายแรกของคุณ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g, i) => (
              <GoalCard key={g.id} goal={g} isFeatured={i === 0}
                onDeposit={setDepositing}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Create button ── */}
        <button onClick={() => setShowCreate(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
          <Plus size={16} strokeWidth={2.5} /> สร้างเป้าหมายใหม่
        </button>

      </div>

      {/* Modals */}
      {(showCreate || editing) && (
        <GoalModal
          initial={editing}
          onSuccess={() => { setShowCreate(false); setEditing(null); fetchGoals(); }}
          onClose={() => { setShowCreate(false); setEditing(null); }}
        />
      )}
      {depositing && (
        <DepositModal
          goal={depositing}
          onSuccess={() => { setDepositing(null); fetchGoals(); }}
          onClose={() => setDepositing(null)}
        />
      )}
    </>
  );
}
