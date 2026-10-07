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
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        country: true,
        programs: true,
        _count: {
          select: {
            applications: true,
            commissions: true,
          },
        },
      },
    });

    if (!university || university.deletedAt) {
      return NextResponse.json({ error: "الجامعة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ university });
  } catch (error) {
    console.error("Get university error:", error);
    return NextResponse.json({ error: "فشل تحميل بيانات الجامعة" }, { status: 500 });
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

    const existing = await prisma.university.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "الجامعة غير موجودة" }, { status: 404 });
    }

    const {
      nameAr,
      nameEn,
      countryId,
      city,
      type,
      website,
      contactPerson,
      contactEmail,
      contactPhone,
      responsibleStaff,
      generalRequirements,
      deadlinesSummary,
      commissionType,
      commissionValue,
      commissionCurrency,
      contractStatus,
      contractStartDate,
      contractEndDate,
      contractFileUrl,
      notes,
      isActive,
    } = body;

    const data: any = {};
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (countryId !== undefined) data.countryId = countryId;
    if (city !== undefined) data.city = city;
    if (type !== undefined) data.type = type;
    if (website !== undefined) data.website = website;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (responsibleStaff !== undefined) data.responsibleStaff = responsibleStaff;
    if (generalRequirements !== undefined) data.generalRequirements = generalRequirements;
    if (deadlinesSummary !== undefined) data.deadlinesSummary = deadlinesSummary;
    if (commissionType !== undefined) data.commissionType = commissionType;
    if (commissionValue !== undefined) data.commissionValue = parseFloat(commissionValue);
    if (commissionCurrency !== undefined) data.commissionCurrency = commissionCurrency;
    if (contractStatus !== undefined) data.contractStatus = contractStatus;
    if (contractStartDate !== undefined) data.contractStartDate = contractStartDate ? new Date(contractStartDate) : null;
    if (contractEndDate !== undefined) data.contractEndDate = contractEndDate ? new Date(contractEndDate) : null;
    if (contractFileUrl !== undefined) data.contractFileUrl = contractFileUrl;
    if (notes !== undefined) data.notes = notes;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    data.updatedBy = session?.userId;

    const updated = await prisma.university.update({
      where: { id },
      data,
      include: {
        country: { select: { nameAr: true, flagEmoji: true } },
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "University",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, university: updated });
  } catch (error) {
    console.error("Update university error:", error);
    return NextResponse.json({ error: "فشل تعديل بيانات الجامعة" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const existing = await prisma.university.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الجامعة غير موجودة" }, { status: 404 });
    }

    await prisma.university.update({
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
      entity: "University",
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete university error:", error);
    return NextResponse.json({ error: "فشل حذف الجامعة" }, { status: 500 });
  }
}
