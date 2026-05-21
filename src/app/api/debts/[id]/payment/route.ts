import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debtPaymentSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!debt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = debtPaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const newRemaining = Math.max(0, Number(debt.remainingAmount) - data.amount);

  const [payment] = await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        debtId: params.id,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        note: data.note,
      },
    }),
    prisma.debt.update({
      where: { id: params.id },
      data: {
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? "PAID" : "ACTIVE",
      },
    }),
  ]);

  return NextResponse.json({ ...payment, amount: payment.amount.toString() }, { status: 201 });
}
