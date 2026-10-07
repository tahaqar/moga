import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const payments = await prisma.payment.findMany({
      where: { studentId: id, deletedAt: null },
      include: {
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "فشل تحميل المدفوعات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canCreate = session.roleName === "admin" || (await hasPermission("create", "payments"));
    if (!canCreate) return NextResponse.json({ error: "لا تملك صلاحية إضافة سند قبض" }, { status: 403 });

    const body = await req.json();
    const { receiptNumber, amount, currency, method, status, notes, paymentDate } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: "المبلغ المدفوع مطلوب كرقم صالح" }, { status: 400 });
    }

    const count = await prisma.payment.count();
    const generatedReceipt = receiptNumber || `REC-2026-${String(count + 1).padStart(3, "0")}`;
    const parsedAmount = parseFloat(amount);

    const payment = await prisma.payment.create({
      data: {
        receiptNumber: generatedReceipt,
        studentId,
        amount: parsedAmount,
        currency: currency || "USD",
        baseAmount: parsedAmount,
        exchangeRate: 1.0,
        method: method || "cash",
        notes: notes || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        receiverId: session.userId,
        createdBy: session.userId,
      },
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "payment",
        titleAr: `تسجيل دفعة مالية: ${payment.amount} ${payment.currency}`,
        titleEn: `Payment recorded: ${payment.amount} ${payment.currency}`,
        description: `رقم السند: ${payment.receiptNumber}، الطريقة: ${payment.method}`,
        color: "green",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "Payment",
      entityId: payment.id,
      details: `تسجيل سند قبض ${payment.receiptNumber} بمبلغ ${payment.amount} ${payment.currency}`,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "فشل إضافة الدفعة المالية" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "payments"));
    if (!canEdit) return NextResponse.json({ error: "لا تملك صلاحية تعديل السند" }, { status: 403 });

    const body = await req.json();
    const { paymentId, amount, currency, method, status, notes, paymentDate } = body;

    if (!paymentId) return NextResponse.json({ error: "معرف السند مطلوب" }, { status: 400 });

    const updateData: any = {};
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      updateData.amount = parsed;
      updateData.baseAmount = parsed;
    }
    if (currency !== undefined) updateData.currency = currency;
    if (method !== undefined) updateData.method = method;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "Payment",
      entityId: paymentId,
      details: `تحديث سند القبض ${payment.receiptNumber}`,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "فشل تحديث السند" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "payments"));
    if (!canDelete) return NextResponse.json({ error: "لا تملك صلاحية حذف سند القبض" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) return NextResponse.json({ error: "معرف السند مطلوب" }, { status: 400 });

    const p = await prisma.payment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "Payment",
      entityId: paymentId,
      details: `حذف سند القبض ${p.receiptNumber}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف السند بنجاح" });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "فشل حذف السند" }, { status: 500 });
  }
}
