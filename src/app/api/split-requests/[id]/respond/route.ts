import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({ action: z.enum(["APPROVED", "REJECTED"]) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });

  const request = await prisma.splitRequest.findFirst({
    where: { id: params.id, toUserId: session.user.id },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "PENDING") return NextResponse.json({ error: "ดำเนินการแล้ว" }, { status: 400 });

  const updated = await prisma.splitRequest.update({
    where: { id: params.id },
    data: { status: parsed.data.action },
  });

  return NextResponse.json({ ...updated, amount: updated.amount.toString() });
}
