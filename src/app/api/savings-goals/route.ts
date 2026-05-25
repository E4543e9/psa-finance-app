import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255),
  emoji: z.string().default("🎯"),
  targetAmount: z.number().positive(),
  savedAmount: z.number().min(0).default(0),
  deadline: z.string().optional().nullable(),
  weeklyTarget: z.number().min(0).optional().nullable(),
  color: z.string().default("#FF5B36"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals.map((g) => ({
    ...g,
    targetAmount: g.targetAmount.toString(),
    savedAmount: g.savedAmount.toString(),
    weeklyTarget: g.weeklyTarget?.toString() ?? null,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, emoji, targetAmount, savedAmount, deadline, weeklyTarget, color } = parsed.data;

  const goal = await prisma.savingsGoal.create({
    data: {
      name, emoji, color,
      targetAmount,
      savedAmount,
      deadline: deadline ? new Date(deadline) : null,
      weeklyTarget: weeklyTarget ?? null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({
    ...goal,
    targetAmount: goal.targetAmount.toString(),
    savedAmount: goal.savedAmount.toString(),
    weeklyTarget: goal.weeklyTarget?.toString() ?? null,
  }, { status: 201 });
}
