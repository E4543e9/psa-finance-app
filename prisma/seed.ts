import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // สร้าง user เริ่มต้น (เปลี่ยน email/password ก่อน deploy)
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { userId: "admin" },
    update: {},
    create: {
      userId: "admin",
      email: "admin@finance.local",
      password: hashedPassword,
      name: "Admin",
    },
  });

  console.log("Created user:", user.email);

  // หมวดหมู่ Income
  const incomeCategories = [
    { name: "เงินเดือน", icon: "💼", color: "#22c55e" },
    { name: "ฟรีแลนซ์", icon: "💻", color: "#16a34a" },
    { name: "ดอกเบี้ย", icon: "🏦", color: "#15803d" },
    { name: "อื่นๆ", icon: "📦", color: "#166534" },
  ];

  // หมวดหมู่ Expense
  const expenseCategories = [
    { name: "อาหาร", icon: "🍜", color: "#ef4444" },
    { name: "เดินทาง", icon: "🚗", color: "#f97316" },
    { name: "บ้าน", icon: "🏠", color: "#eab308" },
    { name: "ความบันเทิง", icon: "🎮", color: "#a855f7" },
    { name: "สุขภาพ", icon: "💊", color: "#ec4899" },
    { name: "อื่นๆ", icon: "📦", color: "#6b7280" },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: {
        // ไม่มี unique constraint บน name+userId — ใช้ findFirst แทน
        id: `income-${cat.name}-${user.id}`,
      },
      update: {},
      create: {
        id: `income-${cat.name}-${user.id}`,
        name: cat.name,
        type: "INCOME",
        icon: cat.icon,
        color: cat.color,
        userId: user.id,
      },
    });
  }

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: {
        id: `expense-${cat.name}-${user.id}`,
      },
      update: {},
      create: {
        id: `expense-${cat.name}-${user.id}`,
        name: cat.name,
        type: "EXPENSE",
        icon: cat.icon,
        color: cat.color,
        userId: user.id,
      },
    });
  }

  console.log("Seeded categories");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
