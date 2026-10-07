import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    const appWhere: any = { deletedAt: null };
    if (countryId && countryId !== "all") {
      appWhere.countryId = countryId;
    }

    const stages = await prisma.kanbanStage.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      include: {
        applications: {
          where: appWhere,
          include: {
            student: { select: { id: true, studentCode: true, fullNameAr: true, phone: true } },
            country: { select: { nameAr: true, flagEmoji: true } },
            university: { select: { nameAr: true, nameEn: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error("Get kanban error:", error);
    return NextResponse.json({ error: "Failed to load kanban" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { applicationId, newStageId } = body;

    if (!applicationId || !newStageId) {
      return NextResponse.json({ error: "ApplicationId and newStageId are required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { stage: true, student: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const newStage = await prisma.kanbanStage.findUnique({
      where: { id: newStageId },
    });

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        stageId: newStageId,
        status: newStage?.isTerminal ? "completed" : "in_progress",
      },
    });

    // Create automatic timeline event
    await prisma.timelineEvent.create({
      data: {
        studentId: application.studentId,
        category: "application",
        titleAr: `نقل طلب التقديم إلى مرحلة: ${newStage?.nameAr}`,
        titleEn: `Application moved to: ${newStage?.nameEn}`,
        description: `تم النقل من ${application.stage.nameAr} إلى ${newStage?.nameAr}`,
        color: "green",
        actorName: session?.name || "System",
      },
    });

    // Log audit
    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "status_change",
      entity: "Application",
      entityId: applicationId,
      oldValue: { stageId: application.stageId, stageName: application.stage.nameAr },
      newValue: { stageId: newStageId, stageName: newStage?.nameAr },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("Update kanban error:", error);
    return NextResponse.json({ error: "Failed to move stage" }, { status: 500 });
  }
}
