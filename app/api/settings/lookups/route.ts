import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = { deletedAt: null };
    if (category) where.category = category;

    const options = await prisma.lookupOption.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Get lookups error:", error);
    return NextResponse.json({ error: "Failed to load options" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { category, key, labelAr, labelEn, color, order } = body;

    if (!category || !key || !labelAr) {
      return NextResponse.json({ error: "الفئة والمفتاح والاسم بالعربية حقول مطلوبة" }, { status: 400 });
    }

    const existing = await prisma.lookupOption.findUnique({
      where: { category_key: { category, key } },
    });

    if (existing) {
      return NextResponse.json({ error: "الخيار موجود مسبقاً في هذه الفئة" }, { status: 409 });
    }

    const option = await prisma.lookupOption.create({
      data: {
        category,
        key,
        labelAr,
        labelEn: labelEn || labelAr,
        color: color || "#6366f1",
        order: order ? parseInt(order) : 0,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "LookupOption",
      entityId: option.id,
      newValue: option,
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Create lookup error:", error);
    return NextResponse.json({ error: "Failed to create option" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, labelAr, labelEn, color, order, isActive } = body;

    const oldOption = await prisma.lookupOption.findUnique({ where: { id } });
    if (!oldOption) return NextResponse.json({ error: "Option not found" }, { status: 404 });

    const updated = await prisma.lookupOption.update({
      where: { id },
      data: {
        labelAr: labelAr !== undefined ? labelAr : oldOption.labelAr,
        labelEn: labelEn !== undefined ? labelEn : oldOption.labelEn,
        color: color !== undefined ? color : oldOption.color,
        order: order !== undefined ? parseInt(order) : oldOption.order,
        isActive: isActive !== undefined ? isActive : oldOption.isActive,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "LookupOption",
      entityId: id,
      oldValue: oldOption,
      newValue: updated,
    });

    return NextResponse.json({ success: true, option: updated });
  } catch (error) {
    console.error("Update lookup error:", error);
    return NextResponse.json({ error: "Failed to update option" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const option = await prisma.lookupOption.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "LookupOption",
      entityId: id,
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Delete lookup error:", error);
    return NextResponse.json({ error: "Failed to delete option" }, { status: 500 });
  }
}
