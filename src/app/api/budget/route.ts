import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";
import { startOfMonth, endOfMonth } from "date-fns";
import { getCurrentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? getCurrentMonth();

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id, month },
      include: { category: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth(new Date(`${month}-01`)),
          lte: endOfMonth(new Date(`${month}-01`)),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const expenseMap = Object.fromEntries(
    expenses.map((e) => [e.categoryId, Number(e._sum.amount ?? 0)])
  );

  return NextResponse.json(
    budgets.map((b) => ({
      ...b,
      amount: b.amount.toString(),
      spent: expenseMap[b.categoryId] ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const budget = await prisma.budget.upsert({
    where: {
      categoryId_month_userId: {
        categoryId: data.categoryId,
        month: data.month,
        userId: session.user.id,
      },
    },
    update: { amount: data.amount },
    create: {
      categoryId: data.categoryId,
      amount: data.amount,
      month: data.month,
      userId: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...budget, amount: budget.amount.toString() });
}
