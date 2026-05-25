import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255).optional(),
  emoji: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  savedAmount: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
  weeklyTarget: z.number().min(0).optional().nullable(),
  color: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
      ...(data.savedAmount !== undefined && { savedAmount: data.savedAmount }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.weeklyTarget !== undefined && { weeklyTarget: data.weeklyTarget }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });

  return NextResponse.json({
    ...updated,
    targetAmount: updated.targetAmount.toString(),
    savedAmount: updated.savedAmount.toString(),
    weeklyTarget: updated.weeklyTarget?.toString() ?? null,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
