import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = format(new Date(), "yyyy-MM");

  const bills = await prisma.monthlyBill.findMany({
    where: { userId: session.user.id },
    include: {
      category: true,
      payments: { where: { month } },
    },
    orderBy: { dueDay: "asc" },
  });

  const pending = bills.filter((b) => b.payments.length === 0);

  return NextResponse.json({
    count: pending.length,
    bills: pending.map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount.toString(),
      dueDay: b.dueDay,
      isVariable: b.isVariable,
      category: b.category,
    })),
  });
}
