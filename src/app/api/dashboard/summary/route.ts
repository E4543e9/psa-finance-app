import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // รายรับ-รายจ่ายเดือนนี้
  const [incomeThisMonth, expenseThisMonth] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  // หนี้รวมที่ยังค้างอยู่
  const totalDebt = await prisma.debt.aggregate({
    where: { userId, status: "ACTIVE" },
    _sum: { remainingAmount: true },
  });

  // 12 เดือนย้อนหลัง
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(now, i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "INCOME", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    const label = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" }).format(month);
    monthlyData.push({
      month: label,
      income: Number(inc._sum.amount ?? 0),
      expense: Number(exp._sum.amount ?? 0),
    });
  }

  // รายจ่ายตามหมวดหมู่ เดือนนี้
  const categoryExpenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 6,
  });

  const categoryIds = categoryExpenses.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const donutData = categoryExpenses.map((c) => ({
    name: catMap[c.categoryId]?.name ?? "อื่นๆ",
    value: Number(c._sum.amount ?? 0),
    color: catMap[c.categoryId]?.color ?? "#6b7280",
    icon: catMap[c.categoryId]?.icon ?? "📦",
  }));

  // ธุรกรรมล่าสุด 10 รายการ
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
    include: { category: true },
  });

  const totalIncome = Number(incomeThisMonth._sum.amount ?? 0);
  const totalExpense = Number(expenseThisMonth._sum.amount ?? 0);

  return NextResponse.json({
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      totalDebt: Number(totalDebt._sum.remainingAmount ?? 0),
    },
    monthlyData,
    donutData,
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    })),
  });
}
