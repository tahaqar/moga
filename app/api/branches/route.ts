import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { deletedAt: null },
      orderBy: [{ isHeadquarter: "desc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
      },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Fetch branches error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { name, code, city, country, address, phone, email, isHeadquarter } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "اسم الفرع مطلوب" }, { status: 400 });
    }

    const branchCode = (code && code.trim()) || `BR-${Math.floor(100 + Math.random() * 900)}`;

    // If marked as HQ, unmark existing HQs
    if (isHeadquarter) {
      await prisma.branch.updateMany({
        where: { isHeadquarter: true },
        data: { isHeadquarter: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: branchCode.toUpperCase(),
        city: city?.trim() || "المدينة",
        country: country?.trim() || "الدولة",
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isHeadquarter: Boolean(isHeadquarter),
        isActive: true,
      },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "create",
        entity: "Branch",
        entityId: branch.id,
        details: `إضافة فرع جديد: ${branch.name} (${branch.code})`,
      });
    }

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error: any) {
    console.error("Create branch error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "رمز الفرع (Code) مستخدم بالفعل، يرجى اختيار رمز آخر" }, { status: 400 });
    }
    return NextResponse.json({ error: "فشل إنشاء الفرع" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, name, code, city, country, address, phone, email, isHeadquarter, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الفرع مطلوب" }, { status: 400 });
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
    }

    if (isHeadquarter && !existing.isHeadquarter) {
      await prisma.branch.updateMany({
        where: { isHeadquarter: true },
        data: { isHeadquarter: false },
      });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        code: code !== undefined ? code.trim().toUpperCase() : existing.code,
        city: city !== undefined ? city.trim() : existing.city,
        country: country !== undefined ? country.trim() : existing.country,
        address: address !== undefined ? address.trim() : existing.address,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        email: email !== undefined ? email.trim() : existing.email,
        isHeadquarter: isHeadquarter !== undefined ? Boolean(isHeadquarter) : existing.isHeadquarter,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "update",
        entity: "Branch",
        entityId: id,
        details: `تعديل بيانات فرع: ${updated.name}`,
        oldValue: existing,
        newValue: updated,
      });
    }

    return NextResponse.json({ success: true, branch: updated });
  } catch (error: any) {
    console.error("Update branch error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "رمز الفرع (Code) مستخدم بالفعل، يرجى اختيار رمز آخر" }, { status: 400 });
    }
    return NextResponse.json({ error: "فشل تعديل الفرع" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الفرع مطلوب" }, { status: 400 });
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
    }

    // Safely disconnect users and students before deletion
    await prisma.user.updateMany({
      where: { branchId: id },
      data: { branchId: null },
    });

    await prisma.student.updateMany({
      where: { branchId: id },
      data: { branchId: null },
    });

    await prisma.branch.delete({
      where: { id },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "delete",
        entity: "Branch",
        entityId: id,
        details: `حذف فرع: ${existing.name} (${existing.code})`,
      });
    }

    return NextResponse.json({ success: true, message: "تم حذف الفرع بنجاح" });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json({ error: "فشل حذف الفرع" }, { status: 500 });
  }
}
