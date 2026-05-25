import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billPaymentSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bill = await prisma.monthlyBill.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = billPaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Upsert: ถ้าเดือนนี้มีอยู่แล้วให้ update
  const payment = await prisma.billPayment.upsert({
    where: { billId_month: { billId: id, month: data.month } },
    update: {
      amount: data.amount,
      status: data.status,
      paidDate: new Date(data.paidDate),
      note: data.note || null,
    },
    create: {
      billId: id,
      month: data.month,
      amount: data.amount,
      status: data.status,
      paidDate: new Date(data.paidDate),
      note: data.note || null,
    },
  });

  return NextResponse.json({ ...payment, amount: payment.amount.toString() }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bill = await prisma.monthlyBill.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

  await prisma.billPayment.deleteMany({
    where: { billId: id, month },
  });

  return NextResponse.json({ success: true });
}
