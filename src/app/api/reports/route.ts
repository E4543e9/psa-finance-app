import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 });

  const fromDate = startOfMonth(new Date(from));
  const toDate = endOfMonth(new Date(to));

  const months = eachMonthOfInterval({ start: fromDate, end: toDate });

  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: "INCOME", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: "EXPENSE", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      return {
        month: format(month, "MMM yy"),
        income: Number(inc._sum.amount ?? 0),
        expense: Number(exp._sum.amount ?? 0),
      };
    })
  );

  // Top 5 รายจ่ายตามหมวดหมู่
  const topCategories = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId: session.user.id, type: "EXPENSE", date: { gte: fromDate, lte: toDate } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const catIds = topCategories.map((c) => c.categoryId);
  const cats = await prisma.category.findMany({ where: { id: { in: catIds } } });
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);

  return NextResponse.json({
    monthlyData,
    topCategories: topCategories.map((c) => ({
      name: catMap[c.categoryId]?.name ?? "อื่นๆ",
      amount: Number(c._sum.amount ?? 0),
      color: catMap[c.categoryId]?.color ?? "#6b7280",
      icon: catMap[c.categoryId]?.icon ?? "📦",
    })),
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    },
  });
}
