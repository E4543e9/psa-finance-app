"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard,
  BarChart3, LogOut, Menu, X, Moon, Sun, Receipt, Users, Bell, Lightbulb
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "รายรับ-รายจ่าย", icon: ArrowLeftRight },
  { href: "/bills", label: "ค่าใช้จ่ายประจำ", icon: Receipt },
  { href: "/debts", label: "หนี้สิน", icon: CreditCard },
  { href: "/budget", label: "เป้าหมายการออม", icon: Lightbulb },
  { href: "/groups", label: "กลุ่ม / บ้าน", icon: Users },
  { href: "/notifications", label: "การแจ้งเตือน", icon: Bell },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "รายรับ-รายจ่าย",
  "/bills": "ค่าใช้จ่ายประจำ",
  "/debts": "หนี้สิน",
  "/budget": "เป้าหมายการออม",
  "/groups": "กลุ่ม / บ้าน",
  "/notifications": "การแจ้งเตือน",
};

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [pendingSplits, setPendingSplits] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const [notifRes, splitRes] = await Promise.all([
          fetch("/api/notifications"),
          fetch("/api/split-requests"),
        ]);
        if (notifRes.ok) {
          const data = await notifRes.json();
          setPendingSplits(data.pendingSplits ?? 0);
        }
        if (splitRes.ok) {
          const data = await splitRes.json();
          const pending = (data.incoming ?? []).filter((r: any) => r.status === "PENDING").length;
          setPendingRequests(pending);
        }
      } catch { /* ignore */ }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] ?? "PSA Finance";

  return (
    <>
      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden psa-scrim"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile top bar ── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-30 lg:hidden bg-background/90 backdrop-blur-md border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors flex-shrink-0"
          aria-label="เมนู"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <span className="font-bold text-sm flex-1 truncate tracking-tight">
          psa<span style={{ color: "#FF5B36" }}>.</span>
          <span className="font-normal text-muted-foreground ml-1.5">{pageTitle}</span>
        </span>
        <Link href="/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted transition-colors flex-shrink-0"
        >
          <Bell size={18} strokeWidth={1.8} />
          {(pendingSplits + pendingRequests) > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {pendingSplits + pendingRequests > 9 ? "9+" : pendingSplits + pendingRequests}
            </span>
          )}
        </Link>
      </header>

      {/* ── Sidebar drawer ── */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
        "lg:translate-x-0 lg:z-30",
        "bg-ink-card text-ink-card-fg",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Logo + close */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* PSA mark */}
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl" style={{ background: "#0C0B0A", boxShadow: "0 0 0 1.5px #FF5B3633" }}>
              <span className="font-black text-base leading-none select-none" style={{ color: "#FF5B36", fontFamily: "system-ui, sans-serif", letterSpacing: "-0.5px" }}>P.</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight tracking-tight">
                psa<span style={{ color: "#FF5B36" }}>.</span>
              </div>
              <div className="text-[10px] opacity-40 mt-0.5 tracking-wide">finance, made calm</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isNotifications = item.href === "/notifications";
            const isTransactions = item.href === "/transactions";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "opacity-60 hover:opacity-100 hover:bg-white/10"
                )}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
                <span className="flex-1">{item.label}</span>
                {isNotifications && pendingRequests > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center",
                    active ? "bg-white/20" : "bg-primary text-primary-foreground"
                  )}>
                    {pendingRequests}
                  </span>
                )}
                {isTransactions && pendingSplits > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center",
                    active ? "bg-white/20" : "bg-amber-400 text-black"
                  )}>
                    {pendingSplits}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 hover:bg-white/10 w-full transition-all"
          >
            {theme === "dark" ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/15 w-full transition-all"
          >
            <LogOut size={16} strokeWidth={1.7} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
