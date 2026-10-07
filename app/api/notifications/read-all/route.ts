import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getCurrentUser();
    let targetUserId = session?.userId;
    if (!targetUserId) {
      const admin = await prisma.user.findFirst({ where: { role: { name: "admin" } } });
      targetUserId = admin?.id;
    }

    if (targetUserId) {
      await prisma.notification.updateMany({
        where: {
          userId: targetUserId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error("Notifications read all error:", error);
    return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
  }
}
