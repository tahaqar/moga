import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visaCase = await prisma.visaCase.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, phone: true } },
        country: true,
        checklistItems: true,
      },
    });

    if (!visaCase || visaCase.deletedAt) {
      return NextResponse.json({ error: "ملف التأشيرة غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ visaCase });
  } catch (error) {
    console.error("Get visa case error:", error);
    return NextResponse.json({ error: "فشل تحميل ملف التأشيرة" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    const body = await req.json();

    const existing = await prisma.visaCase.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "ملف التأشيرة غير موجود" }, { status: 404 });
    }

    const {
      status,
      embassyLocation,
      appointmentDate,
      submissionDate,
      decisionDate,
      visaDuration,
      notes,
      rejectionReason,
    } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (embassyLocation !== undefined) data.embassyLocation = embassyLocation;
    if (appointmentDate !== undefined) data.appointmentDate = appointmentDate ? new Date(appointmentDate) : null;
    if (submissionDate !== undefined) data.submissionDate = submissionDate ? new Date(submissionDate) : null;
    if (decisionDate !== undefined) data.decisionDate = decisionDate ? new Date(decisionDate) : null;
    if (visaDuration !== undefined) data.visaDuration = visaDuration;
    if (notes !== undefined) data.notes = notes;
    if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;

    data.updatedBy = session?.userId;

    const updated = await prisma.visaCase.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        country: true,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "VisaCase",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, visaCase: updated });
  } catch (error) {
    console.error("Update visa case error:", error);
    return NextResponse.json({ error: "فشل تعديل ملف التأشيرة" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const existing = await prisma.visaCase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ملف التأشيرة غير موجود" }, { status: 404 });
    }

    await prisma.visaCase.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session?.userId,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "VisaCase",
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete visa case error:", error);
    return NextResponse.json({ error: "فشل حذف ملف التأشيرة" }, { status: 500 });
  }
}
