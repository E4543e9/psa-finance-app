import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// List users in same group(s) as the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find groups the current user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  const groupIds = memberships.map((m) => m.groupId);

  if (groupIds.length === 0) {
    return NextResponse.json([]);
  }

  // Find all members in those groups (excluding self)
  const members = await prisma.groupMember.findMany({
    where: {
      groupId: { in: groupIds },
      userId: { not: session.user.id },
    },
    include: {
      user: { select: { id: true, userId: true, name: true } },
      group: { select: { id: true, name: true } },
    },
  });

  // Deduplicate by userId
  const seen = new Set<string>();
  const unique = members
    .filter((m) => {
      if (seen.has(m.user.id)) return false;
      seen.add(m.user.id);
      return true;
    })
    .map((m) => ({
      id: m.user.id,
      userId: m.user.userId,
      name: m.user.name,
      groupName: m.group.name,
    }));

  return NextResponse.json(unique);
}
