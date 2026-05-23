import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/utils";

// คืนจำนวนบิลที่ยังไม่ได้จ่ายเดือนนี้ — ใช้สำหรับ badge แจ้งเตือน
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  const month = getCurrentMonth();

  const allBills = await prisma.monthlyBill.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { payments: { where: { month } } },
  });

  const unpaid = allBills.filter((b) => b.payments.length === 0).length;
  const waitingRefund = allBills.filter(
    (b) => b.payments[0]?.status === "WAITING_REFUND"
  ).length;

  return NextResponse.json({ unpaid, waitingRefund, total: unpaid + waitingRefund });
}
