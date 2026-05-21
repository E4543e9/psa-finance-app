import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const debts = await prisma.debt.findMany({
    where: { userId: session.user.id },
    include: { payments: { orderBy: { paymentDate: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    debts.map((d) => ({
      ...d,
      totalAmount: d.totalAmount.toString(),
      remainingAmount: d.remainingAmount.toString(),
      interestRate: d.interestRate.toString(),
      monthlyPayment: d.monthlyPayment.toString(),
      payments: d.payments.map((p) => ({ ...p, amount: p.amount.toString() })),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const debt = await prisma.debt.create({
    data: {
      name: data.name,
      creditor: data.creditor,
      totalAmount: data.totalAmount,
      remainingAmount: data.remainingAmount,
      interestRate: data.interestRate,
      monthlyPayment: data.monthlyPayment,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      type: data.type,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    ...debt,
    totalAmount: debt.totalAmount.toString(),
    remainingAmount: debt.remainingAmount.toString(),
    interestRate: debt.interestRate.toString(),
    monthlyPayment: debt.monthlyPayment.toString(),
  }, { status: 201 });
}
