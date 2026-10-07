import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const universities = await prisma.university.findMany({
      where: { deletedAt: null },
      include: {
        country: { select: { id: true, nameAr: true, nameEn: true, flagEmoji: true } },
        programs: true,
        _count: {
          select: {
            applications: true,
            commissions: true,
          },
        },
      },
      orderBy: { nameAr: "asc" },
    });

    return NextResponse.json({ universities });
  } catch (error) {
    console.error("Get universities error:", error);
    return NextResponse.json({ error: "Failed to load universities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

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
      notes,
    } = body;

    if (!nameAr || !countryId || !city) {
      return NextResponse.json({ error: "الاسم والدولة والمدينة حقول مطلوبة" }, { status: 400 });
    }

    const university = await prisma.university.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        countryId,
        city: city.trim(),
        type: type || "university",
        website: website || "",
        contactPerson: contactPerson || "",
        contactEmail: contactEmail || "",
        contactPhone: contactPhone || "",
        responsibleStaff: responsibleStaff || "",
        generalRequirements: generalRequirements || "",
        deadlinesSummary: deadlinesSummary || "",
        commissionType: commissionType || "percentage",
        commissionValue: commissionValue ? parseFloat(commissionValue) : 15,
        commissionCurrency: commissionCurrency || "EUR",
        contractStatus: contractStatus || "active",
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        notes: notes || "",
        createdBy: session?.userId,
      },
      include: {
        country: { select: { id: true, nameAr: true, flagEmoji: true } },
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "University",
      entityId: university.id,
      newValue: university,
    });

    return NextResponse.json({ success: true, university }, { status: 201 });
  } catch (error) {
    console.error("Create university error:", error);
    return NextResponse.json({ error: "فشل إضافة الجامعة" }, { status: 500 });
  }
}
