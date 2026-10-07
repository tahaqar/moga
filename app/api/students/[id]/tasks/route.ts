import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      where: { studentId: id, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: "فشل تحميل المهام" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { title, description, dueDate, priority, assigneeId } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "عنوان المهمة مطلوب" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        studentId,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 86400000 * 2),
        priority: priority || "normal",
        status: "pending",
        assigneeId: assigneeId || session.userId,
        createdBy: session.userId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "task",
        titleAr: `إسناد مهمة جديدة: ${task.title}`,
        titleEn: `Task assigned: ${task.title}`,
        description: `أُسندت إلى: ${task.assignee?.name || "غير محدد"}`,
        color: "yellow",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "فشل إضافة المهمة" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { taskId, status, title, description, dueDate, priority, assigneeId } = body;

    if (!taskId) return NextResponse.json({ error: "معرف المهمة مطلوب" }, { status: 400 });

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "فشل تحديث المهمة" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) return NextResponse.json({ error: "معرف المهمة مطلوب" }, { status: 400 });

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "تم حذف المهمة بنجاح" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "فشل حذف المهمة" }, { status: 500 });
  }
}
