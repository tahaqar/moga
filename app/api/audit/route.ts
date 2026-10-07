import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Get audit error:", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await prisma.auditLog.deleteMany({});
      return NextResponse.json({ success: true, message: "تم مسح جميع سجلات العمليات" });
    }

    if (!id) {
      return NextResponse.json({ error: "معرف السجل مطلوب" }, { status: 400 });
    }

    await prisma.auditLog.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف السجل بنجاح" });
  } catch (error) {
    console.error("Delete audit error:", error);
    return NextResponse.json({ error: "فشل حذف سجل العمليات" }, { status: 500 });
  }
}
