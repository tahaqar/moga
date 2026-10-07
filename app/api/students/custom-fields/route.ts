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
    const activeOnly = searchParams.get("active") === "true";

    const where: any = {
      entity: "Student",
      deletedAt: null,
    };
    if (activeOnly) {
      where.isActive = true;
    }

    const fields = await prisma.customField.findMany({
      where,
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Get custom fields error:", error);
    return NextResponse.json({ error: "فشل تحميل الحقول المخصصة" }, { status: 500 });
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
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الحقول المخصصة" }, { status: 403 });
    }

    const body = await req.json();
    const { name, labelAr, labelEn, type, optionsJson, isRequired, order } = body;

    if (!name?.trim() || !labelAr?.trim()) {
      return NextResponse.json({ error: "اسم الحقل والتسمية بالعربية مطلوبان" }, { status: 400 });
    }

    // Format field name: lowerCamelCase or snake_case
    const formattedName = name.trim().replace(/\s+/g, "_").toLowerCase();

    // Check duplicate name
    const existing = await prisma.customField.findFirst({
      where: { entity: "Student", name: formattedName, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "يوجد حقل مخصص مسجل مسبقاً بنفس الاسم" }, { status: 409 });
    }

    const maxOrder = await prisma.customField.aggregate({
      where: { entity: "Student", deletedAt: null },
      _max: { order: true },
    });
    const nextOrder = order !== undefined ? order : (maxOrder._max.order ?? -1) + 1;

    const field = await prisma.customField.create({
      data: {
        entity: "Student",
        name: formattedName,
        labelAr: labelAr.trim(),
        labelEn: labelEn?.trim() || labelAr.trim(),
        type: type || "text",
        optionsJson: Array.isArray(optionsJson) ? JSON.stringify(optionsJson) : optionsJson || null,
        isRequired: !!isRequired,
        order: nextOrder,
        isActive: true,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "CustomField",
      entityId: field.id,
      details: `إضافة حقل مخصص جديد للطالب: ${field.labelAr} (${field.name})`,
      newValue: field,
    });

    return NextResponse.json({ success: true, field }, { status: 201 });
  } catch (error) {
    console.error("Create custom field error:", error);
    return NextResponse.json({ error: "فشل إضافة الحقل المخصص" }, { status: 500 });
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
      return NextResponse.json({ error: "لا تملك صلاحية تعديل الحقول المخصصة" }, { status: 403 });
    }

    const body = await req.json();
    const { id, labelAr, labelEn, type, optionsJson, isRequired, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الحقل مطلوب" }, { status: 400 });
    }

    const updateData: any = {};
    if (labelAr !== undefined) updateData.labelAr = labelAr.trim();
    if (labelEn !== undefined) updateData.labelEn = labelEn.trim();
    if (type !== undefined) updateData.type = type;
    if (optionsJson !== undefined) {
      updateData.optionsJson = Array.isArray(optionsJson) ? JSON.stringify(optionsJson) : optionsJson;
    }
    if (isRequired !== undefined) updateData.isRequired = !!isRequired;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updated = await prisma.customField.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "CustomField",
      entityId: id,
      details: `تحديث الحقل المخصص: ${updated.labelAr}`,
      newValue: updated,
    });

    return NextResponse.json({ success: true, field: updated });
  } catch (error) {
    console.error("Update custom field error:", error);
    return NextResponse.json({ error: "فشل تحديث الحقل المخصص" }, { status: 500 });
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
      return NextResponse.json({ error: "لا تملك صلاحية حذف الحقول المخصصة" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الحقل مطلوب" }, { status: 400 });
    }

    const field = await prisma.customField.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "CustomField",
      entityId: id,
      details: `حذف الحقل المخصص: ${field.labelAr}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف الحقل المخصص بنجاح" });
  } catch (error) {
    console.error("Delete custom field error:", error);
    return NextResponse.json({ error: "فشل حذف الحقل المخصص" }, { status: 500 });
  }
}
