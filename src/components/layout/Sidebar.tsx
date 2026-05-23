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
  { href: "/budget", label: "คำแนะนำการเงิน", icon: Lightbulb },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/groups", label: "กลุ่ม / บ้าน", icon: Users },
  { href: "/notifications", label: "การแจ้งเตือน", icon: Bell },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "รายรับ-รายจ่าย",
  "/bills": "ค่าใช้จ่ายประจำ",
  "/debts": "หนี้สิน",
  "/budget": "คำแนะนำการเงิน",
  "/reports": "รายงาน",
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
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Mobile top bar ── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-30 lg:hidden bg-background border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors flex-shrink-0"
          aria-label="เมนู"
        >
          <Menu size={21} />
        </button>
        <span className="font-bold text-base flex-1 truncate">{pageTitle}</span>
        {(pendingSplits + pendingRequests) > 0 && (
          <Link href="/notifications">
            <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {pendingSplits + pendingRequests}
            </span>
          </Link>
        )}
      </header>

      {/* ── Sidebar drawer ── */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 flex flex-col transition-transform duration-200 shadow-xl",
        "lg:shadow-none lg:translate-x-0 lg:z-30",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo + close */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="st" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="sl" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#15803d" /><stop offset="100%" stopColor="#166534" />
                  </linearGradient>
                  <linearGradient id="sr" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#16a34a" /><stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>
                <polygon points="32,4 56,18 32,32 8,18" fill="url(#st)" />
                <polygon points="8,18 32,32 32,56 8,42" fill="url(#sl)" />
                <polygon points="56,18 32,32 32,56 56,42" fill="url(#sr)" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">PSA Finance</h1>
              <p className="text-xs text-muted-foreground">จัดการการเงิน</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={17} />
                <span className="flex-1">{item.label}</span>
                {isNotifications && pendingRequests > 0 && (
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center",
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white")}>
                    {pendingRequests}
                  </span>
                )}
                {isTransactions && pendingSplits > 0 && (
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center",
                    active ? "bg-white/20 text-white" : "bg-amber-500 text-white")}>
                    {pendingSplits}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-border space-y-0.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 w-full transition-colors"
          >
            <LogOut size={17} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
