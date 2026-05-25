"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Plus, PiggyBank, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard",    label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/transactions", label: "รายการ",   icon: ArrowLeftRight },
  { href: "ADD",           label: "",          icon: Plus },
  { href: "/budget",       label: "ออม",      icon: PiggyBank },
  { href: "/reports",      label: "รายงาน",   icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-7 left-3.5 right-3.5 z-40 lg:hidden">
      <div
        className="h-16 rounded-[22px] grid grid-cols-5 items-center px-2.5"
        style={{ background: "hsl(var(--ink-card))", boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}
      >
        {mainNav.map((item) => {
          if (item.href === "ADD") {
            return (
              <Link
                key="add"
                href="/transactions"
                className="flex items-center justify-center"
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  <Plus size={22} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }

          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--ink-card-fg) / 0.5)" }}
              />
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
  );
}
