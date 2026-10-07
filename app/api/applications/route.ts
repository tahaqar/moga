import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");
    const status = searchParams.get("status");

    const where: any = { deletedAt: null };
    if (countryId && countryId !== "all") where.countryId = countryId;
    if (status && status !== "all") where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, phone: true } },
        country: { select: { id: true, nameAr: true, flagEmoji: true } },
        university: { select: { id: true, nameAr: true, nameEn: true, city: true } },
        program: { select: { id: true, nameAr: true, nameEn: true, level: true } },
        stage: { select: { id: true, nameAr: true, slug: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

    const { studentId, countryId, universityId, programId, customMajor, level, intake, tuitionFee } = body;

    if (!studentId || !countryId || !universityId) {
      return NextResponse.json({ error: "Student, Country, and University are required" }, { status: 400 });
    }

    const count = await prisma.application.count();
    const applicationCode = `APP-2026-${String(count + 1).padStart(3, "0")}`;

    // Default stage is "new_applications"
    const defaultStage = await prisma.kanbanStage.findFirst({
      where: { slug: "new_applications" },
    });

    const application = await prisma.application.create({
      data: {
        applicationCode,
        studentId,
        countryId,
        universityId,
        programId: programId || null,
        customMajor: customMajor || null,
        level: level || "bachelor",
        intake: intake || "Fall 2026",
        stageId: defaultStage?.id || "stage-new",
        status: "submitted",
        tuitionFee: tuitionFee ? parseFloat(tuitionFee) : 6000,
        responsibleUserId: session?.userId,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "application",
        titleAr: `تقديم طلب جامعي جديد: ${applicationCode}`,
        titleEn: `New application submitted: ${applicationCode}`,
        color: "blue",
        actorName: session?.name || "System",
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "Application",
      entityId: application.id,
      newValue: application,
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Create application error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
