import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const documents = await prisma.studentDocument.findMany({
      where: { deletedAt: null },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true, fullNameEn: true } },
        documentType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const docTypes = await prisma.documentType.findMany({
      where: { deletedAt: null },
      orderBy: { category: "asc" },
    });

    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      select: { id: true, studentCode: true, fullNameAr: true },
      orderBy: { fullNameAr: "asc" },
    });

    return NextResponse.json({ documents, docTypes, students });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

    const {
      studentId,
      documentTypeId,
      title,
      fileUrl,
      fileName,
      fileSize,
      fileMimeType,
      status,
      notes,
      expiryDate,
    } = body;

    if (!studentId || !documentTypeId || !title) {
      return NextResponse.json({ error: "الطالب ونوع المستند وعنوان المستند حقول مطلوبة" }, { status: 400 });
    }

    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        documentTypeId,
        title: title.trim(),
        fileUrl: fileUrl || "/uploads/sample-doc.pdf",
        fileName: fileName || "document.pdf",
        fileSize: fileSize ? Number(fileSize) : 1024,
        fileMimeType: fileMimeType || "application/pdf",
        status: status || "waiting_for_student",
        notes: notes || "",
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdBy: session?.userId,
      },
      include: {
        student: { select: { id: true, studentCode: true, fullNameAr: true } },
        documentType: true,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        studentId,
        category: "document",
        titleAr: `إضافة مستند جديد: ${doc.title}`,
        titleEn: `New document added: ${doc.title}`,
        color: "indigo",
        actorName: session?.name || "System",
      },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "create",
      entity: "StudentDocument",
      entityId: doc.id,
      newValue: doc,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "فشل إضافة المستند" }, { status: 500 });
  }
}
