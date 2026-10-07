import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        role: true,
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const branches = await prisma.branch.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: true, students: true } },
      },
      orderBy: { isHeadquarter: "desc" },
    });

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users, branches, roles });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json({ error: "Failed to load employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { name, email, password, phone, roleId, branchId, isActive } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "الاسم والبريد الإلكتروني وكلمة المرور والرتبة الوظيفية مطلوبة" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل لمستخدم آخر بالفعل" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        phone: phone?.trim() || null,
        roleId,
        branchId: branchId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdBy: session?.name || "System",
      },
      include: {
        role: true,
        branch: true,
      },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "create",
        entity: "User",
        entityId: user.id,
        details: `إضافة موظف جديد: ${user.name} (${user.email}) - دور: ${user.role.displayName}`,
        newValue: { id: user.id, name: user.name, email: user.email, role: user.role.name },
      });
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: error.message || "فشل إنشاء الموظف" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, name, email, password, phone, roleId, branchId, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الموظف مطلوب" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    }

    if (email && email.trim().toLowerCase() !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailTaken) {
        return NextResponse.json({ error: "البريد الإلكتروني الجديد مستخدم بالفعل" }, { status: 400 });
      }
    }

    let passwordHash = existing.passwordHash;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        passwordHash,
        phone: phone !== undefined ? phone?.trim() || null : existing.phone,
        roleId: roleId || existing.roleId,
        branchId: branchId !== undefined ? branchId || null : existing.branchId,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        updatedBy: session?.name || "System",
      },
      include: {
        role: true,
        branch: true,
      },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "update",
        entity: "User",
        entityId: id,
        details: `تعديل بيانات موظف: ${updated.name}`,
        oldValue: { name: existing.name, email: existing.email, roleId: existing.roleId },
        newValue: { name: updated.name, email: updated.email, roleId: updated.roleId },
      });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: error.message || "فشل تعديل بيانات الموظف" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الموظف مطلوب" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!existing) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    }

    // Protect last admin from deletion
    if (existing.role.name === "admin") {
      const adminCount = await prisma.user.count({
        where: { role: { name: "admin" }, deletedAt: null },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "لا يمكن حذف المشرف العام الوحيد في النظام" }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: session?.name || "System",
      },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        userName: session.name,
        action: "delete",
        entity: "User",
        entityId: id,
        details: `حذف موظف: ${existing.name} (${existing.email})`,
      });
    }

    return NextResponse.json({ success: true, message: "تم حذف الموظف بنجاح" });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: error.message || "فشل حذف الموظف" }, { status: 500 });
  }
}
