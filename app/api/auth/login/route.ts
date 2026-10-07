import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roleName: user.role.name,
      roleDisplayName: user.role.displayName,
      branchId: user.branchId,
      branchCode: user.branch?.code,
    });

    // Log audit
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "login",
      entity: "User",
      entityId: user.id,
      details: `تسجيل دخول ناجح للمستخدم ${user.name} (${user.email})`,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: {
          name: user.role.name,
          displayName: user.role.displayName,
        },
        branch: user.branch ? { id: user.branch.id, name: user.branch.name, code: user.branch.code } : null,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع في الخادم أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
