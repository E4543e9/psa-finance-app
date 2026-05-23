import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { userId: session.user.id };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.description = { contains: search };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({ ...t, amount: t.amount.toString() })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      note: data.note,
      paidTo: data.paidTo || null,
      splitWith: data.splitWith || null,
      splitWithUserId: (body.splitWithUserId as string) || null,
      splitAmount: data.splitWith && data.splitAmount ? data.splitAmount : null,
      splitStatus: data.splitWith ? "PENDING" : null,
      categoryId: data.categoryId,
      userId: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json({ ...transaction, amount: transaction.amount.toString() }, { status: 201 });
}
