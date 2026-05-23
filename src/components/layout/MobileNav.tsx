"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Receipt, Bell, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/transactions", label: "รายการ", icon: ArrowLeftRight },
  { href: "/bills", label: "บิล", icon: Receipt },
  { href: "/notifications", label: "แจ้งเตือน", icon: Bell },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t border-border safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
        {/* More menu */}
        <Link
          href="/groups"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
            ["/groups", "/debts", "/reports", "/budget"].includes(pathname)
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Grid3X3 size={20} strokeWidth={1.8} />
          เพิ่มเติม
        </Link>
      </div>
    </nav>
  );
}
