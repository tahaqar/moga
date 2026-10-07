import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const communications = await prisma.communication.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true, phone: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true, phone: true },
      orderBy: { fullNameAr: "asc" },
    });

    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates, communications, students, users });
  } catch (error) {
    console.error("Get communications error:", error);
    return NextResponse.json({ error: "Failed to load communications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { entityType } = body;

    if (entityType === "template") {
      const { code, nameAr, nameEn, channel, contentAr, contentEn, variables, isActive } = body;

      if (!nameAr || !contentAr) {
        return NextResponse.json({ error: "Template name and content in Arabic are required" }, { status: 400 });
      }

      const tplCode =
        code && code.trim() !== ""
          ? code.trim().toLowerCase().replace(/\s+/g, "_")
          : `tpl_${Date.now()}`;

      const template = await prisma.messageTemplate.create({
        data: {
          code: tplCode,
          nameAr: nameAr.trim(),
          nameEn: nameEn?.trim() || nameAr.trim(),
          channel: channel || "whatsapp",
          contentAr: contentAr.trim(),
          contentEn: contentEn?.trim() || contentAr.trim(),
          variables: variables || "{student_name}, {university}, {major}, {date}",
          isActive: isActive !== undefined ? isActive : true,
          createdBy: user?.name || "System",
        },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "create",
        entity: "MessageTemplate",
        entityId: template.id,
        details: `Created message template ${template.nameAr}`,
        newValue: template,
      });

      return NextResponse.json({ success: true, template });
    } else {
      // Default: create communication record
      const { studentId, userId, type, direction, subject, content, sentAt } = body;

      if (!studentId || !content) {
        return NextResponse.json({ error: "Student and content are required" }, { status: 400 });
      }

      const communication = await prisma.communication.create({
        data: {
          studentId,
          userId: userId || user?.userId || null,
          type: type || "whatsapp",
          direction: direction || "outbound",
          subject: subject || null,
          content: content.trim(),
          sentAt: sentAt ? new Date(sentAt) : new Date(),
          createdBy: user?.name || "System",
        },
        include: {
          student: { select: { fullNameAr: true } },
          user: { select: { name: true } },
        },
      });

      // Add to student timeline
      await prisma.timelineEvent.create({
        data: {
          studentId,
          category: "communication",
          titleAr: `تواصل (${type}): ${subject || "محادثة"}`,
          titleEn: `Communication (${type}): ${subject || "Conversation"}`,
          description: content.slice(0, 150),
          color: "blue",
          actorName: user?.name || "System",
          actorId: user?.userId || null,
        },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "create",
        entity: "Communication",
        entityId: communication.id,
        details: `Logged communication (${type}) with student ${communication.student?.fullNameAr}`,
        newValue: communication,
      });

      return NextResponse.json({ success: true, communication });
    }
  } catch (error: any) {
    console.error("Create communication error:", error);
    return NextResponse.json({ error: error.message || "Failed to create record" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { id, entityType } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (entityType === "template") {
      const { nameAr, nameEn, channel, contentAr, contentEn, variables, isActive } = body;
      const existing = await prisma.messageTemplate.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

      const updated = await prisma.messageTemplate.update({
        where: { id },
        data: {
          nameAr: nameAr ? nameAr.trim() : existing.nameAr,
          nameEn: nameEn !== undefined ? nameEn.trim() : existing.nameEn,
          channel: channel || existing.channel,
          contentAr: contentAr ? contentAr.trim() : existing.contentAr,
          contentEn: contentEn !== undefined ? contentEn.trim() : existing.contentEn,
          variables: variables !== undefined ? variables : existing.variables,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          updatedBy: user?.name || "System",
        },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "update",
        entity: "MessageTemplate",
        entityId: id,
        details: `Updated message template ${updated.nameAr}`,
        oldValue: existing,
        newValue: updated,
      });

      return NextResponse.json({ success: true, template: updated });
    } else {
      const { type, direction, subject, content, sentAt } = body;
      const existing = await prisma.communication.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Communication record not found" }, { status: 404 });

      const updated = await prisma.communication.update({
        where: { id },
        data: {
          type: type || existing.type,
          direction: direction || existing.direction,
          subject: subject !== undefined ? subject : existing.subject,
          content: content ? content.trim() : existing.content,
          sentAt: sentAt ? new Date(sentAt) : existing.sentAt,
          updatedBy: user?.name || "System",
        },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "update",
        entity: "Communication",
        entityId: id,
        details: `Updated communication record (${updated.type})`,
        oldValue: existing,
        newValue: updated,
      });

      return NextResponse.json({ success: true, communication: updated });
    }
  } catch (error: any) {
    console.error("Update communication error:", error);
    return NextResponse.json({ error: error.message || "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const entityType = searchParams.get("entityType") || "communication";

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (entityType === "template") {
      const existing = await prisma.messageTemplate.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Template not found" }, { status: 404 });

      await prisma.messageTemplate.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: user?.name || "System" },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "delete",
        entity: "MessageTemplate",
        entityId: id,
        details: `Deleted template ${existing.nameAr}`,
      });
    } else {
      const existing = await prisma.communication.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Communication not found" }, { status: 404 });

      await prisma.communication.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: user?.name || "System" },
      });

      await logAudit({
        userId: user?.userId,
        userName: user?.name,
        action: "delete",
        entity: "Communication",
        entityId: id,
        details: `Deleted communication record`,
      });
    }

    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (error: any) {
    console.error("Delete communication error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete record" }, { status: 500 });
  }
}
