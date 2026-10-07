import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { decryptPassport, encryptPassport } from "@/lib/crypto";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canRead = session.roleName === "admin" || (await hasPermission("view", "students"));
    if (!canRead) {
      return NextResponse.json({ error: "لا تملك صلاحية عرض ملف الطالب" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { id, deletedAt: null },
      include: {
        branch: true,
        counselor: { select: { id: true, name: true, email: true, phone: true } },
        leadSource: true,
        applications: {
          where: { deletedAt: null },
          include: {
            country: true,
            university: true,
            program: true,
            stage: true,
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          where: { deletedAt: null },
          include: { documentType: true },
          orderBy: { createdAt: "desc" },
        },
        visaCases: {
          where: { deletedAt: null },
          include: {
            country: true,
            checklistItems: true,
            responsibleOfficer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          where: { deletedAt: null },
          include: { receiver: { select: { id: true, name: true } } },
          orderBy: { paymentDate: "desc" },
        },
        contracts: {
          include: { invoices: true },
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          where: { deletedAt: null },
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { dueDate: "asc" },
        },
        communications: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { sentAt: "desc" },
        },
        travelRecords: {
          orderBy: { departureDate: "desc" },
        },
        timelineEvents: {
          orderBy: { eventDate: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    // Decrypt passport number for authorized viewing
    const decryptedStudent = {
      ...student,
      passportNumber: decryptPassport(student.passportNumberEnc),
    };

    return NextResponse.json({ student: decryptedStudent });
  } catch (error) {
    console.error("Get student error:", error);
    return NextResponse.json({ error: "فشل تحميل تفاصيل الطالب" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "students"));
    if (!canEdit) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل بيانات الطالب" }, { status: 403 });
    }

    const body = await req.json();

    const oldStudent = await prisma.student.findUnique({ where: { id } });
    if (!oldStudent) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    const updateData: any = { ...body };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.applications;
    delete updateData.documents;
    delete updateData.visaCases;
    delete updateData.payments;
    delete updateData.tasks;
    delete updateData.communications;
    delete updateData.timelineEvents;
    delete updateData.branch;
    delete updateData.counselor;
    delete updateData.leadSource;

    if (body.passportNumber) {
      updateData.passportNumberEnc = encryptPassport(body.passportNumber);
      delete updateData.passportNumber;
    }

    if (body.budget !== undefined) {
      updateData.budget = body.budget ? parseFloat(body.budget) : null;
    }

    if (body.birthDate) {
      updateData.birthDate = new Date(body.birthDate);
    }

    if (body.customFieldsData && typeof body.customFieldsData === "object") {
      updateData.customFieldsData = JSON.stringify(body.customFieldsData);
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    // If status changed, create timeline event
    if (body.status && body.status !== oldStudent.status) {
      await prisma.timelineEvent.create({
        data: {
          studentId: id,
          category: "status_change",
          titleAr: `تغيير حالة الطالب إلى: ${body.status}`,
          titleEn: `Status changed to: ${body.status}`,
          description: `تم التحديث بواسطة ${session?.name || "المستشار"}`,
          color: "green",
          actorName: session?.name || "System",
          actorId: session?.userId,
        },
      });
    }

    // Audit log
    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "Student",
      entityId: id,
      oldValue: oldStudent,
      newValue: updated,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "فشل تحديث بيانات الطالب" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "students"));
    if (!canDelete) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف الطالب" }, { status: 403 });
    }

    // Soft delete
    const student = await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "Student",
      entityId: id,
      details: `حذف ملف الطالب: ${student.fullNameAr} (${student.studentCode})`,
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "فشل حذف ملف الطالب" }, { status: 500 });
  }
}
