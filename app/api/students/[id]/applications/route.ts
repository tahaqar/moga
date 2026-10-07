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

    const applications = await prisma.application.findMany({
      where: { studentId: id, deletedAt: null },
      include: {
        country: true,
        university: true,
        program: true,
        stage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "فشل تحميل التقديمات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canCreate = session.roleName === "admin" || (await hasPermission("create", "applications"));
    if (!canCreate) return NextResponse.json({ error: "لا تملك صلاحية إضافة تقديم جامعي" }, { status: 403 });

    const body = await req.json();
    const { countryId, universityId, programId, customMajor, level, intake, tuitionFee, status, notes } = body;

    if (!countryId || !universityId) {
      return NextResponse.json({ error: "الدولة والجامعة مطلوبة" }, { status: 400 });
    }

    // Auto generate application code
    const count = await prisma.application.count();
    const applicationCode = `APP-2026-${String(count + 1).padStart(3, "0")}`;

    // Get default kanban stage if exists or create one
    let defaultStage = await prisma.kanbanStage.findFirst({
      where: { isDefault: true, deletedAt: null },
    });
    if (!defaultStage) {
      defaultStage = await prisma.kanbanStage.findFirst({
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      });
    }
    if (!defaultStage) {
      defaultStage = await prisma.kanbanStage.create({
        data: {
          nameAr: "طلبات جديدة",
          nameEn: "New Applications",
          slug: "new_applications_" + Date.now(),
          order: 1,
          color: "#3b82f6",
          isDefault: true,
        },
      });
    }

    const application = await prisma.application.create({
      data: {
        applicationCode,
        studentId,
        countryId,
        universityId,
        programId: programId || null,
        customMajor: customMajor || null,
        level: level || "bachelor",
        intake: intake || "Fall 2026",
        tuitionFee: tuitionFee ? parseFloat(tuitionFee) : 0,
        status: status || "submitted",
        stageId: defaultStage.id,
        notes: notes || null,
        createdBy: session.userId,
      },
      include: {
        country: true,
        university: true,
        program: true,
        stage: true,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "application",
        titleAr: `تقديم لجامعة جديدة: ${application.university.nameAr}`,
        titleEn: `Applied to university: ${application.university.nameEn}`,
        description: `كود التقديم: ${applicationCode}، التخصص: ${customMajor || "عام"}`,
        color: "green",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "Application",
      entityId: application.id,
      details: `إضافة تقديم جديد لجامعة ${application.university.nameAr} برقم ${applicationCode}`,
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error("Create application error:", error);
    return NextResponse.json({ error: "فشل إنشاء التقديم الجامعي" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "applications"));
    if (!canEdit) return NextResponse.json({ error: "لا تملك صلاحية تعديل التقديم" }, { status: 403 });

    const body = await req.json();
    const { applicationId, status, stageId, tuitionFee, notes, customMajor, intake } = body;

    if (!applicationId) return NextResponse.json({ error: "معرف التقديم مطلوب" }, { status: 400 });

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (stageId !== undefined) updateData.stageId = stageId;
    if (tuitionFee !== undefined) updateData.tuitionFee = tuitionFee ? parseFloat(tuitionFee) : 0;
    if (notes !== undefined) updateData.notes = notes;
    if (customMajor !== undefined) updateData.customMajor = customMajor;
    if (intake !== undefined) updateData.intake = intake;
    updateData.updatedBy = session.userId;

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        country: true,
        university: true,
        program: true,
        stage: true,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "Application",
      entityId: applicationId,
      details: `تحديث حالة التقديم ${application.applicationCode} إلى ${application.status}`,
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "فشل تحديث التقديم" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "applications"));
    if (!canDelete) return NextResponse.json({ error: "لا تملك صلاحية حذف التقديم" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) return NextResponse.json({ error: "معرف التقديم مطلوب" }, { status: 400 });

    const app = await prisma.application.update({
      where: { id: applicationId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "Application",
      entityId: applicationId,
      details: `حذف التقديم الجامعي ${app.applicationCode}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف التقديم بنجاح" });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "فشل حذف التقديم" }, { status: 500 });
  }
}
