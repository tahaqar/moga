import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      where: { deletedAt: null },
      include: {
        universities: {
          select: { id: true, nameAr: true, nameEn: true, city: true, type: true },
        },
        _count: {
          select: {
            applications: true,
            universities: true,
          },
        },
      },
      orderBy: { nameAr: "asc" },
    });

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("Get countries error:", error);
    return NextResponse.json({ error: "Failed to load countries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

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
    } = body;

    if (!nameAr || !nameEn || !code) {
      return NextResponse.json({ error: "الاسم بالعربية والإنجليزية ورمز الدولة حقول مطلوبة" }, { status: 400 });
    }

    const countryCode = code.toUpperCase().trim();

    // Check if code exists
    const existing = await prisma.country.findFirst({
      where: { code: countryCode, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "رمز الدولة مسجل مسبقاً" }, { status: 400 });
    }

    const country = await prisma.country.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        code: countryCode,
        flagEmoji: flagEmoji || "🌍",
        currencyCode: currencyCode || "USD",
        visaRequirements: visaRequirements || "",
        admissionRequirements: admissionRequirements || "",
        languageRequirements: languageRequirements || "",
        checklistNotes: checklistNotes || "",
        responsibleStaff: responsibleStaff || "",
        createdBy: session?.userId,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "Country",
      entityId: country.id,
      newValue: country,
    });

    return NextResponse.json({ success: true, country }, { status: 201 });
  } catch (error) {
    console.error("Create country error:", error);
    return NextResponse.json({ error: "فشل إضافة الدولة" }, { status: 500 });
  }
}
