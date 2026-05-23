import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monthlyBillSchema } from "@/lib/validations";
import { getCurrentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? getCurrentMonth();

  const bills = await prisma.monthlyBill.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      category: true,
      payments: { where: { month } },
    },
    orderBy: { dueDay: "asc" },
  });

  return NextResponse.json(
    bills.map((b) => ({
      ...b,
      amount: b.amount.toString(),
      payment: b.payments[0]
        ? { ...b.payments[0], amount: b.payments[0].amount.toString() }
        : null,
      payments: undefined,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = monthlyBillSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const bill = await prisma.monthlyBill.create({
    data: {
      name: data.name,
      amount: data.amount,
      dueDay: data.dueDay,
      categoryId: data.categoryId,
      paidTo: data.paidTo || null,
      note: data.note,
      userId: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...bill, amount: bill.amount.toString() }, { status: 201 });
}
