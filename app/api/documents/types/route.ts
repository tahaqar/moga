import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const types = await prisma.documentType.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ types });
  } catch (error) {
    console.error("Get document types error:", error);
    return NextResponse.json({ error: "Failed to load document types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

    const { nameAr, nameEn, code, category, isRequired, description } = body;

    if (!nameAr || !nameEn || !code) {
      return NextResponse.json({ error: "الاسم بالعربية والإنجليزية والكود حقول مطلوبة" }, { status: 400 });
    }

    const typeCode = code.toLowerCase().trim();

    const existing = await prisma.documentType.findUnique({ where: { code: typeCode } });
    if (existing) {
      return NextResponse.json({ error: "كود نوع المستند مسجل مسبقاً" }, { status: 400 });
    }

    const docType = await prisma.documentType.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        code: typeCode,
        category: category || "academic",
        isRequired: Boolean(isRequired),
        description: description || "",
        createdBy: session?.userId,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "DocumentType",
      entityId: docType.id,
      newValue: docType,
    });

    return NextResponse.json({ success: true, docType }, { status: 201 });
  } catch (error) {
    console.error("Create document type error:", error);
    return NextResponse.json({ error: "فشل إضافة نوع المستند" }, { status: 500 });
  }
}
