import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");

    const where: any = { deletedAt: null };
    if (entity) where.entity = entity;

    const fields = await prisma.customField.findMany({
      where,
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Get custom fields error:", error);
    return NextResponse.json({ error: "Failed to load custom fields" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { entity, name, labelAr, labelEn, type, optionsJson, isRequired, order } = body;

    if (!entity || !name || !labelAr) {
      return NextResponse.json({ error: "الكيان والاسم البرمجي والاسم بالعربية حقول مطلوبة" }, { status: 400 });
    }

    const field = await prisma.customField.create({
      data: {
        entity,
        name,
        labelAr,
        labelEn: labelEn || labelAr,
        type: type || "text",
        optionsJson: optionsJson || null,
        isRequired: !!isRequired,
        order: order ? parseInt(order) : 0,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "CustomField",
      entityId: field.id,
      newValue: field,
    });

    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error("Create custom field error:", error);
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, labelAr, labelEn, type, optionsJson, isRequired, order, isActive } = body;

    if (!id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const existing = await prisma.customField.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Custom field not found" }, { status: 404 });

    const updated = await prisma.customField.update({
      where: { id },
      data: {
        labelAr: labelAr !== undefined ? labelAr : existing.labelAr,
        labelEn: labelEn !== undefined ? labelEn : existing.labelEn,
        type: type || existing.type,
        optionsJson: optionsJson !== undefined ? optionsJson : existing.optionsJson,
        isRequired: isRequired !== undefined ? Boolean(isRequired) : existing.isRequired,
        order: order !== undefined ? parseInt(order) : existing.order,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "CustomField",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, field: updated });
  } catch (error) {
    console.error("Update custom field error:", error);
    return NextResponse.json({ error: "Failed to update custom field" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Id is required" }, { status: 400 });

    const field = await prisma.customField.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "CustomField",
      entityId: id,
    });

    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error("Delete custom field error:", error);
    return NextResponse.json({ error: "Failed to delete custom field" }, { status: 500 });
  }
}
