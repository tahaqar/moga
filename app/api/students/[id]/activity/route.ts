import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id },
          { details: { contains: id } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const timelineEvents = await prisma.timelineEvent.findMany({
      where: { studentId: id },
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json({
      auditLogs,
      timelineEvents,
    });
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json({ error: "فشل تحميل سجل النشاط" }, { status: 500 });
  }
}
