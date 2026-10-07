import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true } },
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true },
      orderBy: { fullNameAr: "asc" },
    });

    return NextResponse.json({ tasks, users, students });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { title, description, priority, dueDate, assigneeId, studentId, status } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        studentId: studentId || null,
        status: status || "pending",
        creatorId: user?.userId || null,
        createdBy: user?.name || "System",
      },
      include: {
        student: { select: { fullNameAr: true } },
        assignee: { select: { name: true } },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "create",
      entity: "Task",
      entityId: task.id,
      details: `Created task "${task.title}"`,
      newValue: task,
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
        updatedBy: user?.name || "System",
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "status_change",
      entity: "Task",
      entityId: id,
      details: `Toggled task status to "${status}"`,
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Update task status error:", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { id, title, description, priority, dueDate, assigneeId, studentId, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        description: description !== undefined ? description : existing.description,
        priority: priority || existing.priority,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        assigneeId: assigneeId !== undefined ? assigneeId : existing.assigneeId,
        studentId: studentId !== undefined ? studentId : existing.studentId,
        status: status || existing.status,
        completedAt: status === "completed" ? (existing.completedAt || new Date()) : null,
        updatedBy: user?.name || "System",
      },
      include: {
        student: { select: { fullNameAr: true } },
        assignee: { select: { name: true } },
      },
    });

    await logAudit({
      userId: user?.userId,
      userName: user?.name,
      action: "update",
      entity: "Task",
      entityId: id,
      details: `Updated task "${updated.title}"`,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
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
      entity: "Task",
      entityId: id,
      details: `Soft-deleted task "${existing.title}"`,
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
