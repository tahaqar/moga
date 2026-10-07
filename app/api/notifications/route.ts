import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    let targetUserId = session?.userId;
    if (!targetUserId) {
      const admin = await prisma.user.findFirst({ where: { role: { name: "admin" } } });
      targetUserId = admin?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: targetUserId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: targetUserId,
        isRead: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let targetUserId = session?.userId;
    if (!targetUserId) {
      const admin = await prisma.user.findFirst({ where: { role: { name: "admin" } } });
      targetUserId = admin?.id;
    }

    const body = await req.json();
    const { notificationId, isRead } = body;

    if (!notificationId) {
      return NextResponse.json({ error: "معرف التنبيه مطلوب" }, { status: 400 });
    }

    const nextIsRead = typeof isRead === "boolean" ? isRead : true;

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: nextIsRead,
        readAt: nextIsRead ? new Date() : null,
      },
    });

    const countUserId = targetUserId || updated.userId;
    const unreadCount = await prisma.notification.count({
      where: {
        userId: countUserId,
        isRead: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({ success: true, notification: updated, unreadCount });
  } catch (error) {
    console.error("Mark single notification read error:", error);
    return NextResponse.json({ error: "فشل تحديث التنبيه" }, { status: 500 });
  }
}
