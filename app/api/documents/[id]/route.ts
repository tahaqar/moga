import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.studentDocument.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true } },
        documentType: true,
      },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "المستند غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: "فشل تحميل تفاصيل المستند" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    const body = await req.json();

    const existing = await prisma.studentDocument.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "المستند غير موجود" }, { status: 404 });
    }

    const {
      title,
      documentTypeId,
      status,
      fileUrl,
      fileName,
      fileSize,
      notes,
      expiryDate,
      rejectionReason,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (documentTypeId !== undefined) data.documentTypeId = documentTypeId;
    if (status !== undefined) {
      data.status = status;
      if (status === "verified") {
        data.verifiedAt = new Date();
        data.verifiedBy = session?.name || "Admin";
      }
    }
    if (fileUrl !== undefined) data.fileUrl = fileUrl;
    if (fileName !== undefined) data.fileName = fileName;
    if (fileSize !== undefined) data.fileSize = Number(fileSize);
    if (notes !== undefined) data.notes = notes;
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (rejectionReason !== undefined) data.rejectionReason = rejectionReason;

    data.updatedBy = session?.userId;

    const updated = await prisma.studentDocument.update({
      where: { id },
      data,
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        documentType: true,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "update",
      entity: "StudentDocument",
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "فشل تعديل المستند" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    const existing = await prisma.studentDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "المستند غير موجود" }, { status: 404 });
    }

    await prisma.studentDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session?.userId,
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity: "StudentDocument",
      entityId: id,
      oldValue: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "فشل حذف المستند" }, { status: 500 });
  }
}
