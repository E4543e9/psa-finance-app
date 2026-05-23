import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function generateCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, userId: true, name: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json(memberships.map((m) => ({
    ...m.group,
    role: m.role,
    memberCount: m.group.members.length,
    members: m.group.members.map((gm) => ({
      ...gm.user,
      role: gm.role,
      joinedAt: gm.joinedAt,
    })),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = z.object({ name: z.string().min(1).max(100) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  let joinCode = generateCode();
  // Ensure unique
  while (await prisma.group.findUnique({ where: { joinCode } })) {
    joinCode = generateCode();
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      joinCode,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: { members: true },
  });

  return NextResponse.json(group, { status: 201 });
}
