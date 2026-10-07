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
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        universities: true,
        _count: {
          select: {
            applications: true,
            universities: true,
          },
        },
      },
    });

    if (!country || country.deletedAt) {
      return NextResponse.json({ error: "الدولة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ country });
  } catch (error) {
    console.error("Get country error:", error);
    return NextResponse.json({ error: "فشل تحميل بيانات الدولة" }, { status: 500 });
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

    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "الدولة غير موجودة" }, { status: 404 });
    }

    const {
      nameAr,
      nameEn,
      code,
      flagEmoji,
      currencyCode,
      visaRequirements,
      admissionRequirements,
      languageRequirements,
      checklistNotes,
      responsibleStaff,
      isActive,
    } = body;

    const data: any = {};
    if (nameAr !== undefined) data.nameAr = nameAr;
    if (nameEn !== undefined) data.nameEn = nameEn;
    if (code !== undefined) data.code = code.toUpperCase();
    if (flagEmoji !== undefined) data.flagEmoji = flagEmoji;
    if (currencyCode !== undefined) data.currencyCode = currencyCode;
    if (visaRequirements !== undefined) data.visaRequirements = visaRequirements;
    if (admissionRequirements !== undefined) data.admissionRequirements = admissionRequirements;
    if (languageRequirements !== undefined) data.languageRequirements = languageRequirements;
    if (checklistNotes !== undefined) data.checklistNotes = checklistNotes;
    if (responsibleStaff !== undefined) data.responsibleStaff = responsibleStaff;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    data.updatedBy = session?.userId;

    const updated = await prisma.country.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "Country",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, country: updated });
  } catch (error) {
    console.error("Update country error:", error);
    return NextResponse.json({ error: "فشل تعديل بيانات الدولة" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const existing = await prisma.country.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الدولة غير موجودة" }, { status: 404 });
    }

    await prisma.country.update({
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
      entity: "Country",
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete country error:", error);
    return NextResponse.json({ error: "فشل حذف الدولة" }, { status: 500 });
  }
}
