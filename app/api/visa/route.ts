import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const visaCases = await prisma.visaCase.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, phone: true } },
        country: { select: { id: true, nameAr: true, flagEmoji: true } },
        checklistItems: true,
        responsibleOfficer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { id: true, studentCode: true, fullNameAr: true },
      orderBy: { fullNameAr: "asc" },
    });

    const countries = await prisma.country.findMany({
      where: { deletedAt: null },
      select: { id: true, nameAr: true, flagEmoji: true },
      orderBy: { nameAr: "asc" },
    });

    return NextResponse.json({ visaCases, students, countries });
  } catch (error) {
    console.error("Get visa error:", error);
    return NextResponse.json({ error: "Failed to load visa cases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

    const {
      studentId,
      countryId,
      embassyLocation,
      appointmentDate,
      submissionDate,
      status,
      notes,
    } = body;

    if (!studentId || !countryId) {
      return NextResponse.json({ error: "الطالب والوجهة حقول مطلوبة" }, { status: 400 });
    }

    const count = await prisma.visaCase.count();
    const caseNumber = `VISA-2026-${String(count + 1).padStart(3, "0")}`;

    const visaCase = await prisma.visaCase.create({
      data: {
        caseNumber,
        studentId,
        countryId,
        embassyLocation: embassyLocation || "الرياض",
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        submissionDate: submissionDate ? new Date(submissionDate) : null,
        status: status || "preparing_documents",
        notes: notes || "",
        responsibleOfficerId: session?.userId,
        createdBy: session?.userId,
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        country: { select: { id: true, nameAr: true, flagEmoji: true } },
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "VisaCase",
      entityId: visaCase.id,
      newValue: visaCase,
    });

    return NextResponse.json({ success: true, visaCase }, { status: 201 });
  } catch (error) {
    console.error("Create visa error:", error);
    return NextResponse.json({ error: "فشل إضافة ملف التأشيرة" }, { status: 500 });
  }
}
