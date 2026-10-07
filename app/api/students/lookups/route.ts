import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = { deletedAt: null };
    if (category) {
      where.category = category;
    }

    const options = await prisma.lookupOption.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Get lookups error:", error);
    return NextResponse.json({ error: "فشل تحميل خيارات القوائم" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const canManage = session.roleName === "admin" || (await hasPermission("edit", "settings"));
    if (!canManage) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل خيارات القوائم" }, { status: 403 });
    }

    const body = await req.json();
    const { category, key, labelAr, labelEn, color, order } = body;

    if (!category || !key || !labelAr) {
      return NextResponse.json({ error: "التصنيف والمفتاح والتسمية بالعربية مطلوبة" }, { status: 400 });
    }

    const formattedKey = key.trim().toLowerCase().replace(/\s+/g, "_");

    const existing = await prisma.lookupOption.findFirst({
      where: { category, key: formattedKey, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "هذا الخيار موجود مسبقاً في هذا التصنيف" }, { status: 409 });
    }

    const maxOrder = await prisma.lookupOption.aggregate({
      where: { category, deletedAt: null },
      _max: { order: true },
    });
    const nextOrder = order !== undefined ? order : (maxOrder._max.order ?? -1) + 1;

    const option = await prisma.lookupOption.create({
      data: {
        category,
        key: formattedKey,
        labelAr: labelAr.trim(),
        labelEn: labelEn?.trim() || labelAr.trim(),
        color: color || "#6366f1",
        order: nextOrder,
        isActive: true,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "LookupOption",
      entityId: option.id,
      details: `إضافة خيار قائمة: ${option.labelAr} في ${category}`,
      newValue: option,
    });

    return NextResponse.json({ success: true, option }, { status: 201 });
  } catch (error) {
    console.error("Create lookup error:", error);
    return NextResponse.json({ error: "فشل إضافة خيار القائمة" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const canManage = session.roleName === "admin" || (await hasPermission("edit", "settings"));
    if (!canManage) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل خيارات القوائم" }, { status: 403 });
    }

    const body = await req.json();
    const { id, labelAr, labelEn, color, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الخيار مطلوب" }, { status: 400 });
    }

    const updateData: any = {};
    if (labelAr !== undefined) updateData.labelAr = labelAr.trim();
    if (labelEn !== undefined) updateData.labelEn = labelEn.trim();
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updated = await prisma.lookupOption.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "LookupOption",
      entityId: id,
      details: `تحديث خيار قائمة: ${updated.labelAr}`,
      newValue: updated,
    });

    return NextResponse.json({ success: true, option: updated });
  } catch (error) {
    console.error("Update lookup error:", error);
    return NextResponse.json({ error: "فشل تحديث خيار القائمة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const canManage = session.roleName === "admin" || (await hasPermission("delete", "settings"));
    if (!canManage) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف خيارات القوائم" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الخيار مطلوب" }, { status: 400 });
    }

    const option = await prisma.lookupOption.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "LookupOption",
      entityId: id,
      details: `حذف خيار قائمة: ${option.labelAr}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف الخيار بنجاح" });
  } catch (error) {
    console.error("Delete lookup error:", error);
    return NextResponse.json({ error: "فشل حذف خيار القائمة" }, { status: 500 });
  }
}
