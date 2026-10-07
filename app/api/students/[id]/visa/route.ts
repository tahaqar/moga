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

    const visaCases = await prisma.visaCase.findMany({
      where: { studentId: id, deletedAt: null },
      include: {
        country: true,
        responsibleOfficer: { select: { id: true, name: true, email: true } },
        checklistItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ visaCases });
  } catch (error) {
    console.error("Get visa cases error:", error);
    return NextResponse.json({ error: "فشل تحميل ملفات التأشيرة" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canCreate = session.roleName === "admin" || (await hasPermission("create", "visa"));
    if (!canCreate) return NextResponse.json({ error: "لا تملك صلاحية إنشاء ملف تأشيرة" }, { status: 403 });

    const body = await req.json();
    const { countryId, responsibleOfficerId, embassyLocation, appointmentDate, submissionDate, status, notes } = body;

    let targetCountryId = countryId;
    if (!targetCountryId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      const country = await prisma.country.findFirst({
        where: { nameEn: { contains: student?.desiredCountry || "Spain" } },
      });
      targetCountryId = country?.id || (await prisma.country.findFirst())?.id;
    }

    const count = await prisma.visaCase.count();
    const caseNumber = `VISA-2026-${String(count + 1).padStart(3, "0")}`;

    const visaCase = await prisma.visaCase.create({
      data: {
        caseNumber,
        studentId,
        countryId: targetCountryId,
        responsibleOfficerId: responsibleOfficerId || session.userId,
        status: status || "preparing_documents",
        embassyLocation: embassyLocation || null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        notes: notes || null,
        createdBy: session.userId,
      },
      include: {
        country: true,
        responsibleOfficer: { select: { id: true, name: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "visa",
        titleAr: `فتح ملف تأشيرة: ${visaCase.country.nameAr}`,
        titleEn: `Visa case opened: ${visaCase.country.nameEn}`,
        description: `رقم الملف: ${caseNumber}، السفارة: ${embassyLocation || "غير محدد"}`,
        color: "yellow",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "VisaCase",
      entityId: visaCase.id,
      details: `فتح ملف تأشيرة ${caseNumber} للطالب`,
    });

    return NextResponse.json({ success: true, visaCase }, { status: 201 });
  } catch (error) {
    console.error("Create visa case error:", error);
    return NextResponse.json({ error: "فشل فتح ملف التأشيرة" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "visa"));
    if (!canEdit) return NextResponse.json({ error: "لا تملك صلاحية تعديل ملف التأشيرة" }, { status: 403 });

    const body = await req.json();
    const { visaCaseId, status, embassyLocation, appointmentDate, submissionDate, decisionDate, result, rejectionReason, visaNumber, notes } = body;

    if (!visaCaseId) return NextResponse.json({ error: "معرف ملف التأشيرة مطلوب" }, { status: 400 });

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (embassyLocation !== undefined) updateData.embassyLocation = embassyLocation;
    if (appointmentDate !== undefined) updateData.appointmentDate = appointmentDate ? new Date(appointmentDate) : null;
    if (submissionDate !== undefined) updateData.submissionDate = submissionDate ? new Date(submissionDate) : null;
    if (decisionDate !== undefined) updateData.decisionDate = decisionDate ? new Date(decisionDate) : null;
    if (result !== undefined) updateData.result = result;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (visaNumber !== undefined) updateData.visaNumber = visaNumber;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedBy = session.userId;

    const updated = await prisma.visaCase.update({
      where: { id: visaCaseId },
      data: updateData,
      include: {
        country: true,
        responsibleOfficer: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "VisaCase",
      entityId: visaCaseId,
      details: `تحديث ملف التأشيرة ${updated.caseNumber} إلى حالة ${updated.status}`,
    });

    return NextResponse.json({ success: true, visaCase: updated });
  } catch (error) {
    console.error("Update visa case error:", error);
    return NextResponse.json({ error: "فشل تحديث ملف التأشيرة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "visa"));
    if (!canDelete) return NextResponse.json({ error: "لا تملك صلاحية حذف ملف التأشيرة" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const visaCaseId = searchParams.get("visaCaseId");

    if (!visaCaseId) return NextResponse.json({ error: "معرف ملف التأشيرة مطلوب" }, { status: 400 });

    const vc = await prisma.visaCase.update({
      where: { id: visaCaseId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "VisaCase",
      entityId: visaCaseId,
      details: `حذف ملف التأشيرة ${vc.caseNumber}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف ملف التأشيرة بنجاح" });
  } catch (error) {
    console.error("Delete visa case error:", error);
    return NextResponse.json({ error: "فشل حذف ملف التأشيرة" }, { status: 500 });
  }
}
