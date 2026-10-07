import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true } },
        receiver: { select: { id: true, name: true } },
        contract: { select: { id: true, contractNumber: true, totalAmount: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    const contracts = await prisma.contract.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        studentCode: true,
        fullNameAr: true,
        fullNameEn: true,
        phone: true,
        contracts: {
          where: { deletedAt: null, status: "active" },
          select: { id: true, contractNumber: true, remainingAmount: true, currency: true },
        },
      },
      orderBy: { fullNameAr: "asc" },
    });

    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const totalCollected = payments.reduce((acc, p) => acc + (p.baseAmount || p.amount || 0), 0);
    const totalRemaining = contracts.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);

    return NextResponse.json({
      payments,
      contracts,
      students,
      users,
      totalCollected,
      totalRemaining,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      studentId,
      contractId,
      amount,
      currency,
      paymentDate,
      method,
      receiptNumber,
      notes,
      receiverId,
    } = body;

    if (!studentId || !amount) {
      return NextResponse.json({ error: "Student and amount are required" }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const generatedReceipt =
      receiptNumber && receiptNumber.trim() !== ""
        ? receiptNumber.trim()
        : `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await prisma.payment.create({
      data: {
        receiptNumber: generatedReceipt,
        studentId,
        contractId: contractId || null,
        amount: numAmount,
        currency: currency || "USD",
        baseAmount: numAmount,
        exchangeRate: 1.0,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        method: method || "cash",
        receiverId: receiverId || user?.userId || null,
        notes: notes || null,
        createdBy: user?.name || "System",
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        receiver: { select: { name: true } },
      },
    });

    // If attached to a contract, update paidAmount and remainingAmount
    if (contractId) {
      const contract = await prisma.contract.findUnique({ where: { id: contractId } });
      if (contract) {
        const newPaid = (contract.paidAmount || 0) + numAmount;
        const newRemaining = Math.max(0, contract.totalAmount - newPaid);
        await prisma.contract.update({
          where: { id: contractId },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? "completed" : "active",
          },
        });
      }
    }

    // Add timeline event to student profile
    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "payment",
        titleAr: `تحصيل سند قبض: ${payment.amount} ${payment.currency}`,
        titleEn: `Payment Received: ${payment.amount} ${payment.currency}`,
        description: `رقم الإيصال: ${payment.receiptNumber} - طريقة السداد: ${payment.method}`,
        color: "green",
        actorName: user?.name || "System",
        actorId: user?.userId || null,
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "create",
      entity: "Payment",
      entityId: payment.id,
      details: `Created payment receipt ${payment.receiptNumber} for ${payment.amount} ${payment.currency}`,
      newValue: payment,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { id, amount, currency, paymentDate, method, notes, receiverId } = body;

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const numAmount = amount !== undefined ? parseFloat(amount) : existing.amount;

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amount: numAmount,
        currency: currency || existing.currency,
        baseAmount: numAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        method: method || existing.method,
        notes: notes !== undefined ? notes : existing.notes,
        receiverId: receiverId !== undefined ? receiverId : existing.receiverId,
        updatedBy: user?.name || "System",
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        receiver: { select: { name: true } },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "update",
      entity: "Payment",
      entityId: updated.id,
      details: `Updated payment receipt ${updated.receiptNumber}`,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.payment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: user?.name || "System",
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "delete",
      entity: "Payment",
      entityId: id,
      details: `Soft-deleted payment ${existing.receiptNumber}`,
    });

    return NextResponse.json({ success: true, message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}
