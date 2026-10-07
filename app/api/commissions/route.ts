import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const commissions = await prisma.universityCommission.findMany({
      where: { deletedAt: null },
      include: {
        university: { select: { id: true, nameAr: true, nameEn: true } },
        application: {
          select: {
            id: true,
            applicationCode: true,
            customMajor: true,
            student: { select: { id: true, fullNameAr: true, fullNameEn: true, studentCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const universities = await prisma.university.findMany({
      where: { deletedAt: null },
      select: { id: true, nameAr: true, nameEn: true, commissionValue: true, commissionType: true },
      orderBy: { nameAr: "asc" },
    });

    const applications = await prisma.application.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        applicationCode: true,
        customMajor: true,
        universityId: true,
        student: { select: { id: true, fullNameAr: true, fullNameEn: true, studentCode: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const unreceivedTotal = commissions
      .filter((c) => c.status !== "received")
      .reduce((acc, c) => acc + (c.commissionAmount - (c.amountReceived || 0)), 0);

    const receivedTotal = commissions.reduce((acc, c) => acc + (c.amountReceived || 0), 0);
    const expectedTotal = commissions.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

    return NextResponse.json({
      commissions,
      universities,
      applications,
      unreceivedTotal,
      receivedTotal,
      expectedTotal,
    });
  } catch (error) {
    console.error("Get commissions error:", error);
    return NextResponse.json({ error: "Failed to load commissions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      referenceNumber,
      universityId,
      applicationId,
      tuitionPaid,
      tuitionCurrency,
      commissionRate,
      commissionAmount,
      currency,
      status,
      invoicedDate,
      receivedDate,
      amountReceived,
      notes,
    } = body;

    if (!universityId || !applicationId) {
      return NextResponse.json({ error: "University and Application are required" }, { status: 400 });
    }

    const tPaid = parseFloat(tuitionPaid) || 0;
    const cRate = parseFloat(commissionRate) || 0;
    const cAmount = parseFloat(commissionAmount) || (tPaid * cRate) / 100;
    const aRec = parseFloat(amountReceived) || 0;

    const ref =
      referenceNumber && referenceNumber.trim() !== ""
        ? referenceNumber.trim()
        : `COM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const commission = await prisma.universityCommission.create({
      data: {
        referenceNumber: ref,
        universityId,
        applicationId,
        tuitionPaid: tPaid,
        tuitionCurrency: tuitionCurrency || "EUR",
        commissionRate: cRate,
        commissionAmount: cAmount,
        currency: currency || "EUR",
        status: status || "expected",
        invoicedDate: invoicedDate ? new Date(invoicedDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        amountReceived: aRec,
        notes: notes || null,
        createdBy: user?.name || "System",
      },
      include: {
        university: { select: { nameAr: true } },
        application: {
          select: {
            applicationCode: true,
            student: { select: { fullNameAr: true } },
          },
        },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "create",
      entity: "UniversityCommission",
      entityId: commission.id,
      details: `Created university commission ${commission.referenceNumber} for ${commission.university?.nameAr}`,
      newValue: commission,
    });

    return NextResponse.json({ success: true, commission });
  } catch (error: any) {
    console.error("Create commission error:", error);
    return NextResponse.json({ error: error.message || "Failed to create commission" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const {
      id,
      tuitionPaid,
      tuitionCurrency,
      commissionRate,
      commissionAmount,
      currency,
      status,
      invoicedDate,
      receivedDate,
      amountReceived,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Commission ID is required" }, { status: 400 });
    }

    const existing = await prisma.universityCommission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    const tPaid = tuitionPaid !== undefined ? parseFloat(tuitionPaid) : existing.tuitionPaid;
    const cRate = commissionRate !== undefined ? parseFloat(commissionRate) : existing.commissionRate;
    const cAmount = commissionAmount !== undefined ? parseFloat(commissionAmount) : existing.commissionAmount;
    const aRec = amountReceived !== undefined ? parseFloat(amountReceived) : existing.amountReceived;

    const updated = await prisma.universityCommission.update({
      where: { id },
      data: {
        tuitionPaid: tPaid,
        tuitionCurrency: tuitionCurrency || existing.tuitionCurrency,
        commissionRate: cRate,
        commissionAmount: cAmount,
        currency: currency || existing.currency,
        status: status || existing.status,
        invoicedDate: invoicedDate ? new Date(invoicedDate) : existing.invoicedDate,
        receivedDate: receivedDate ? new Date(receivedDate) : existing.receivedDate,
        amountReceived: aRec,
        notes: notes !== undefined ? notes : existing.notes,
        updatedBy: user?.name || "System",
      },
      include: {
        university: { select: { nameAr: true } },
        application: {
          select: {
            applicationCode: true,
            student: { select: { fullNameAr: true } },
          },
        },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "update",
      entity: "UniversityCommission",
      entityId: updated.id,
      details: `Updated commission ${updated.referenceNumber}`,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (error: any) {
    console.error("Update commission error:", error);
    return NextResponse.json({ error: error.message || "Failed to update commission" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Commission ID is required" }, { status: 400 });
    }

    const existing = await prisma.universityCommission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    await prisma.universityCommission.update({
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
      entity: "UniversityCommission",
      entityId: id,
      details: `Soft-deleted commission ${existing.referenceNumber}`,
    });

    return NextResponse.json({ success: true, message: "Commission deleted successfully" });
  } catch (error: any) {
    console.error("Delete commission error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete commission" }, { status: 500 });
  }
}
