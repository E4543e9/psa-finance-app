import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({ joinCode: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "กรุณาระบุ code" }, { status: 400 });

  const group = await prisma.group.findUnique({
    where: { joinCode: parsed.data.joinCode.toUpperCase() },
  });
  if (!group) return NextResponse.json({ error: "ไม่พบกลุ่มนี้" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "เป็นสมาชิกอยู่แล้ว" }, { status: 409 });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: session.user.id, role: "MEMBER" },
  });

  return NextResponse.json({ success: true, groupName: group.name });
}
