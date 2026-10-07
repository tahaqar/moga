import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true, phone: true } },
        payments: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: "desc" },
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true },
      orderBy: { fullNameAr: "asc" },
    });

    return NextResponse.json({ contracts, students });
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json({ error: "Failed to load contracts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { studentId, contractNumber, totalAmount, currency, paidAmount, terms, status, startDate } = body;

    if (!studentId || !totalAmount) {
      return NextResponse.json({ error: "Student and total amount are required" }, { status: 400 });
    }

    const total = parseFloat(totalAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    const remaining = Math.max(0, total - paid);

    const generatedNumber =
      contractNumber && contractNumber.trim() !== ""
        ? contractNumber.trim()
        : `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber: generatedNumber,
        studentId,
        totalAmount: total,
        currency: currency || "USD",
        paidAmount: paid,
        remainingAmount: remaining,
        terms: terms || "",
        status: status || "active",
        startDate: startDate ? new Date(startDate) : new Date(),
        createdBy: user?.name || "System",
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
      },
    });

    // If initial deposit/paidAmount > 0, create initial payment record
    if (paid > 0) {
      await prisma.payment.create({
        data: {
          receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          studentId,
          contractId: contract.id,
          amount: paid,
          currency: currency || "USD",
          baseAmount: paid,
          method: "bank_transfer",
          paymentDate: new Date(),
          receiverId: user?.userId || null,
          notes: "دفعة أولى عند توقيع العقد",
          createdBy: user?.name || "System",
        },
      });
    }

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "create",
      entity: "Contract",
      entityId: contract.id,
      details: `Created contract ${contract.contractNumber} for student ${contract.student?.fullNameAr}`,
      newValue: contract,
    });

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error("Create contract error:", error);
    return NextResponse.json({ error: error.message || "Failed to create contract" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { id, totalAmount, currency, paidAmount, remainingAmount, terms, status, startDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const total = totalAmount !== undefined ? parseFloat(totalAmount) : existing.totalAmount;
    const paid = paidAmount !== undefined ? parseFloat(paidAmount) : existing.paidAmount;
    const remaining = remainingAmount !== undefined ? parseFloat(remainingAmount) : Math.max(0, total - paid);

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        totalAmount: total,
        currency: currency || existing.currency,
        paidAmount: paid,
        remainingAmount: remaining,
        terms: terms !== undefined ? terms : existing.terms,
        status: status || existing.status,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        updatedBy: user?.name || "System",
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "update",
      entity: "Contract",
      entityId: updated.id,
      details: `Updated contract ${updated.contractNumber}`,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, contract: updated });
  } catch (error: any) {
    console.error("Update contract error:", error);
    return NextResponse.json({ error: error.message || "Failed to update contract" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    await prisma.contract.update({
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
      entity: "Contract",
      entityId: id,
      details: `Deleted contract ${existing.contractNumber}`,
    });

    return NextResponse.json({ success: true, message: "Contract deleted successfully" });
  } catch (error: any) {
    console.error("Delete contract error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete contract" }, { status: 500 });
  }
}
