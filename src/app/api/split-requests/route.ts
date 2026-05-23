import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [incoming, outgoing] = await Promise.all([
    prisma.splitRequest.findMany({
      where: { toUserId: session.user.id },
      include: { fromUser: { select: { userId: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.splitRequest.findMany({
      where: { fromUserId: session.user.id },
      include: { toUser: { select: { userId: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    incoming: incoming.map((r) => ({ ...r, amount: r.amount.toString() })),
    outgoing: outgoing.map((r) => ({ ...r, amount: r.amount.toString() })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({
    toUserId: z.string(),
    amount: z.coerce.number().positive(),
    description: z.string().min(1).max(255),
    transactionId: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const toUser = await prisma.user.findUnique({ where: { id: parsed.data.toUserId } });
  if (!toUser) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const request = await prisma.splitRequest.create({
    data: {
      fromUserId: session.user.id,
      toUserId: parsed.data.toUserId,
      amount: parsed.data.amount,
      description: parsed.data.description,
      transactionId: parsed.data.transactionId,
    },
  });

  return NextResponse.json({ ...request, amount: request.amount.toString() }, { status: 201 });
}
