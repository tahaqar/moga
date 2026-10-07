import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const sources = await prisma.leadSource.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error("Get lead sources error:", error);
    return NextResponse.json({ error: "Failed to load lead sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { nameAr, nameEn, code, color, isActive } = body;

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ error: "الاسم بالعربية مطلوب" }, { status: 400 });
    }

    const leadCode = code && code.trim() ? code.trim().toLowerCase() : `src_${Date.now()}`;

    const source = await prisma.leadSource.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || nameAr.trim(),
        code: leadCode,
        color: color || "#6366f1",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdBy: session?.name || "System",
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "LeadSource",
      entityId: source.id,
      details: `Created lead source ${source.nameAr}`,
      newValue: source,
    });

    return NextResponse.json({ success: true, source });
  } catch (error: any) {
    console.error("Create lead source error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "رمز المصدر مستخدم بالفعل" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "فشل إنشاء مصدر الطلاب" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, nameAr, nameEn, color, isActive } = body;

    if (!id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const existing = await prisma.leadSource.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lead source not found" }, { status: 404 });

    const updated = await prisma.leadSource.update({
      where: { id },
      data: {
        nameAr: nameAr !== undefined ? nameAr.trim() : existing.nameAr,
        nameEn: nameEn !== undefined ? nameEn.trim() : existing.nameEn,
        color: color !== undefined ? color : existing.color,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        updatedBy: session?.name || "System",
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "LeadSource",
      entityId: id,
      details: `Updated lead source ${updated.nameAr}`,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, source: updated });
  } catch (error: any) {
    console.error("Update lead source error:", error);
    return NextResponse.json({ error: error.message || "Failed to update lead source" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const existing = await prisma.leadSource.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lead source not found" }, { status: 404 });

    await prisma.leadSource.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: session?.name || "System" },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "LeadSource",
      entityId: id,
      details: `Deleted lead source ${existing.nameAr}`,
    });

    return NextResponse.json({ success: true, message: "Lead source deleted successfully" });
  } catch (error: any) {
    console.error("Delete lead source error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete lead source" }, { status: 500 });
  }
}
