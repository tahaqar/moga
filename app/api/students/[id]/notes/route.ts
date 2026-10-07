import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const notes = await prisma.communication.findMany({
      where: { studentId: id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json({ error: "فشل تحميل الملاحظات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { channel, type, subject, content, direction } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "نص الملاحظة مطلوب" }, { status: 400 });
    }

    const noteType = type || channel || "note";

    const note = await prisma.communication.create({
      data: {
        studentId,
        userId: session.userId,
        type: noteType,
        direction: direction || "outbound",
        subject: subject?.trim() || "ملاحظة متابعة",
        content: content.trim(),
        sentAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "communication",
        titleAr: `إضافة ${noteType === "call" ? "مكالمة" : noteType === "whatsapp" ? "محادثة واتساب" : "ملاحظة"}: ${note.subject}`,
        titleEn: `Note added: ${note.subject}`,
        description: note.content.slice(0, 100),
        color: "indigo",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "فشل إضافة الملاحظة" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { noteId, subject, content, channel, type } = body;

    if (!noteId || !content?.trim()) {
      return NextResponse.json({ error: "معرف الملاحظة والمحتوى مطلوبان" }, { status: 400 });
    }

    const noteType = type || channel;

    const updated = await prisma.communication.update({
      where: { id: noteId },
      data: {
        ...(subject !== undefined && { subject: subject.trim() }),
        content: content.trim(),
        ...(noteType !== undefined && { type: noteType }),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ error: "فشل تحديث الملاحظة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) return NextResponse.json({ error: "معرف الملاحظة مطلوب" }, { status: 400 });

    await prisma.communication.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "تم حذف الملاحظة بنجاح" });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ error: "فشل حذف الملاحظة" }, { status: 500 });
  }
}
