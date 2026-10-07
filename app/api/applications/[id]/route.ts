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
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true, phone: true } },
        country: { select: { id: true, nameAr: true, nameEn: true, flagEmoji: true } },
        university: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        program: { select: { id: true, nameAr: true, nameEn: true, level: true } },
        stage: { select: { id: true, nameAr: true, slug: true, color: true } },
      },
    });

    if (!application || application.deletedAt) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json({ error: "فشل تحميل تفاصيل الطلب" }, { status: 500 });
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

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const {
      countryId,
      universityId,
      customMajor,
      level,
      intake,
      stageId,
      status,
      tuitionFee,
      tuitionCurrency,
      offerType,
      offerExpiry,
      deadline,
    } = body;

    const data: any = {};
    if (countryId !== undefined) data.countryId = countryId;
    if (universityId !== undefined) data.universityId = universityId;
    if (customMajor !== undefined) data.customMajor = customMajor;
    if (level !== undefined) data.level = level;
    if (intake !== undefined) data.intake = intake;
    if (stageId !== undefined) data.stageId = stageId;
    if (status !== undefined) data.status = status;
    if (tuitionFee !== undefined) data.tuitionFee = tuitionFee ? parseFloat(tuitionFee) : null;
    if (tuitionCurrency !== undefined) data.tuitionCurrency = tuitionCurrency;
    if (offerType !== undefined) data.offerType = offerType;
    if (offerExpiry !== undefined) data.offerExpiry = offerExpiry ? new Date(offerExpiry) : null;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

    data.updatedBy = session?.userId;

    const updated = await prisma.application.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true, phone: true } },
        country: { select: { id: true, nameAr: true, nameEn: true, flagEmoji: true } },
        university: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        stage: { select: { id: true, nameAr: true, slug: true, color: true } },
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "Application",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "فشل تعديل الطلب" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Soft delete
    await prisma.application.update({
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
      entity: "Application",
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "فشل حذف الطلب" }, { status: 500 });
  }
}
