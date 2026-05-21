import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// แสดงเงินบาทไทย
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(num);
}

// แสดงวันที่ไทย
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// YYYY-MM สำหรับ budget month
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short" }).format(date);
}

// คำนวณดอกเบี้ยเงินกู้ (เดือน)
export function calcRemainingMonths(
  remaining: number,
  monthlyPayment: number,
  interestRate: number
): number {
  if (monthlyPayment <= 0) return 0;
  const monthlyRate = interestRate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(remaining / monthlyPayment);
  return Math.ceil(
    Math.log(monthlyPayment / (monthlyPayment - remaining * monthlyRate)) /
      Math.log(1 + monthlyRate)
  );
}
