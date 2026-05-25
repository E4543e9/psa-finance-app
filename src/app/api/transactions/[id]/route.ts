import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      note: data.note,
      paidTo: data.paidTo || null,
      splitWith: data.splitWith || null,
      splitAmount: data.splitWith && data.splitAmount ? data.splitAmount : null,
      splitStatus: data.splitWith
        ? (existing.splitStatus ?? "PENDING")
        : null,
      categoryId: data.categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
