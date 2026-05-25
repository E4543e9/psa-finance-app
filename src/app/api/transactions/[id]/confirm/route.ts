import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!existing.splitWith) return NextResponse.json({ error: "No split on this transaction" }, { status: 400 });

  const updated = await prisma.transaction.update({
    where: { id },
    data: { splitStatus: "CONFIRMED" },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}
