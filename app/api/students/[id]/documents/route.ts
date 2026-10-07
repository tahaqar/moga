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

    const documents = await prisma.studentDocument.findMany({
      where: { studentId: id, deletedAt: null },
      include: { documentType: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json({ error: "فشل تحميل المستندات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canCreate = session.roleName === "admin" || (await hasPermission("create", "documents"));
    if (!canCreate) return NextResponse.json({ error: "لا تملك صلاحية إضافة مستند" }, { status: 403 });

    const body = await req.json();
    const { documentTypeId, title, fileUrl, fileName, fileSize, fileMimeType, status, notes, expiryDate } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "عنوان المستند والملف مطلوبان" }, { status: 400 });
    }

    let resolvedTypeId = documentTypeId;
    if (!resolvedTypeId) {
      const defaultType = await prisma.documentType.findFirst();
      resolvedTypeId = defaultType?.id;
    }

    const document = await prisma.studentDocument.create({
      data: {
        studentId,
        documentTypeId: resolvedTypeId,
        title: title.trim(),
        fileUrl,
        fileName: fileName || title,
        fileSize: fileSize || 0,
        fileMimeType: fileMimeType || "application/pdf",
        status: status || "complete",
        notes: notes || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdBy: session.userId,
      },
      include: { documentType: true },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "document",
        titleAr: `رفع مستند جديد: ${document.title}`,
        titleEn: `Document uploaded: ${document.title}`,
        description: `تم إرفاق المستند بواسطة ${session.name}`,
        color: "blue",
        actorName: session.name,
        actorId: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "StudentDocument",
      entityId: document.id,
      details: `رفع مستند ${document.title} للطالب`,
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "فشل إضافة المستند" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "documents"));
    if (!canEdit) return NextResponse.json({ error: "لا تملك صلاحية تعديل المستند" }, { status: 403 });

    const body = await req.json();
    const { documentId, status, notes, rejectionReason, title, expiryDate } = body;

    if (!documentId) return NextResponse.json({ error: "معرف المستند مطلوب" }, { status: 400 });

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "verified") {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = session.name;
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (title !== undefined) updateData.title = title.trim();
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    updateData.updatedBy = session.userId;

    const document = await prisma.studentDocument.update({
      where: { id: documentId },
      data: updateData,
      include: { documentType: true },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "StudentDocument",
      entityId: documentId,
      details: `تحديث حالة المستند ${document.title} إلى ${document.status}`,
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "فشل تحديث المستند" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "documents"));
    if (!canDelete) return NextResponse.json({ error: "لا تملك صلاحية حذف المستند" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) return NextResponse.json({ error: "معرف المستند مطلوب" }, { status: 400 });

    const doc = await prisma.studentDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "StudentDocument",
      entityId: documentId,
      details: `حذف المستند ${doc.title}`,
    });

    return NextResponse.json({ success: true, message: "تم حذف المستند بنجاح" });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "فشل حذف المستند" }, { status: 500 });
  }
}
