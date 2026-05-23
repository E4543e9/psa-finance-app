import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  userId: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { userId, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "ID นี้ถูกใช้งานแล้ว" }, { status: 409 });
  }

  // password field required in schema — store placeholder hash
  const placeholderHash = await bcrypt.hash(userId + "_psa", 10);

  const user = await prisma.user.create({
    data: { userId, name, password: placeholderHash },
  });

  // seed default categories
  const incomeCategories = [
    { name: "เงินเดือน", icon: "💼", color: "#22c55e" },
    { name: "ฟรีแลนซ์", icon: "💻", color: "#16a34a" },
    { name: "ดอกเบี้ย", icon: "🏦", color: "#15803d" },
    { name: "อื่นๆ", icon: "📦", color: "#166534" },
  ];
  const expenseCategories = [
    { name: "อาหาร", icon: "🍜", color: "#ef4444" },
    { name: "เดินทาง", icon: "🚗", color: "#f97316" },
    { name: "บ้าน", icon: "🏠", color: "#eab308" },
    { name: "ความบันเทิง", icon: "🎮", color: "#a855f7" },
    { name: "สุขภาพ", icon: "💊", color: "#ec4899" },
    { name: "อื่นๆ", icon: "📦", color: "#6b7280" },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.create({
      data: { name: cat.name, type: "INCOME", icon: cat.icon, color: cat.color, userId: user.id },
    });
  }
  for (const cat of expenseCategories) {
    await prisma.category.create({
      data: { name: cat.name, type: "EXPENSE", icon: cat.icon, color: cat.color, userId: user.id },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
