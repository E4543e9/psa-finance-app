import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billPaymentSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bill = await prisma.monthlyBill.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = billPaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // upsert — ถ้าจ่ายซ้ำเดือนเดิมให้ update แทน
  const payment = await prisma.billPayment.upsert({
    where: { billId_month: { billId: params.id, month: data.month } },
    update: {
      amount: data.amount,
      status: data.status,
      paidDate: new Date(data.paidDate),
      note: data.note,
    },
    create: {
      billId: params.id,
      amount: data.amount,
      month: data.month,
      status: data.status,
      paidDate: new Date(data.paidDate),
      note: data.note,
    },
  });

  return NextResponse.json({ ...payment, amount: payment.amount.toString() });
}

// ยกเลิกการชำระ (ลบ payment ออก)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

  await prisma.billPayment.deleteMany({
    where: { billId: params.id, month },
  });

  return NextResponse.json({ success: true });
}
