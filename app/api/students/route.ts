import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { encryptPassport } from "@/lib/crypto";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canRead = await hasPermission("read", "students");
    if (!canRead && session.roleName !== "admin") {
      return NextResponse.json({ error: "لا تملك صلاحية عرض الطلاب" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const country = searchParams.get("country") || "";
    const universityId = searchParams.get("universityId") || "";
    const level = searchParams.get("level") || "";
    const status = searchParams.get("status") || "";
    const branchId = searchParams.get("branchId") || "";
    const counselorId = searchParams.get("counselorId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const isExport = searchParams.get("export") === "true";

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { fullNameAr: { contains: search } },
        { fullNameEn: { contains: search } },
        { studentCode: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { nationality: { contains: search } },
      ];
    }

    if (country && country !== "all") {
      where.desiredCountry = country;
    }

    if (level && level !== "all") {
      where.targetLevel = level;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (branchId && branchId !== "all") {
      where.branchId = branchId;
    }

    if (counselorId && counselorId !== "all") {
      where.counselorId = counselorId;
    }

    if (universityId && universityId !== "all") {
      where.applications = {
        some: {
          universityId,
          deletedAt: null,
        },
      };
    }

    // Determine sort column
    let orderBy: any = { createdAt: sortOrder };
    if (sortBy === "name") {
      orderBy = { fullNameAr: sortOrder };
    } else if (sortBy === "code") {
      orderBy = { studentCode: sortOrder };
    } else if (sortBy === "status") {
      orderBy = { status: sortOrder };
    } else if (sortBy === "date") {
      orderBy = { registrationDate: sortOrder };
    }

    const total = await prisma.student.count({ where });

    const students = await prisma.student.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true, city: true } },
        counselor: { select: { id: true, name: true, email: true } },
        applications: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            level: true,
            country: { select: { id: true, nameAr: true, flagEmoji: true } },
            university: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
        _count: {
          select: {
            applications: true,
            documents: true,
            payments: true,
            visaCases: true,
            tasks: true,
          },
        },
      },
      orderBy,
      ...(isExport ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "فشل تحميل بيانات الطلاب" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canCreate = await hasPermission("create", "students");
    if (!canCreate && session.roleName !== "admin") {
      return NextResponse.json({ error: "لا تملك صلاحية إضافة طلاب" }, { status: 403 });
    }

    const body = await req.json();

    const {
      fullNameAr,
      fullNameEn,
      nationality,
      phone,
      whatsapp,
      email,
      passportNumber,
      city,
      residenceCountry,
      lastCertificate,
      gpa,
      previousMajor,
      languageLevel,
      ieltsToeflScore,
      desiredMajor,
      desiredCountry,
      targetLevel,
      budget,
      budgetCurrency,
      intake,
      branchId,
      counselorId,
      leadSourceId,
      status,
      notes,
      customFieldsData,
    } = body;

    // Strict validation
    if (!fullNameAr?.trim()) {
      return NextResponse.json({ error: "الاسم الكامل للطالب بالعربية مطلوب" }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "رقم الهاتف مطلوب للتواصل والمتابعة" }, { status: 400 });
    }
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "يرجى إدخال بريد إلكتروني صالح" }, { status: 400 });
    }

    // Duplicate detection
    const existing = await prisma.student.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { phone: phone.trim() },
          { email: email.trim().toLowerCase() },
          ...(whatsapp ? [{ whatsapp: whatsapp.trim() }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `يوجد طالب مسجل مسبقاً بنفس رقم الهاتف أو البريد (${existing.fullNameAr} - كود: ${existing.studentCode})`,
        },
        { status: 409 }
      );
    }

    // Generate unique student code
    const count = await prisma.student.count();
    const studentCode = `AML-2026-${String(count + 1).padStart(3, "0")}`;

    // Target branch
    const targetBranchId =
      branchId ||
      session.branchId ||
      (await prisma.branch.findFirst({ where: { isHeadquarter: true, deletedAt: null } }))?.id ||
      null;

    const student = await prisma.student.create({
      data: {
        studentCode,
        fullNameAr: fullNameAr.trim(),
        fullNameEn: fullNameEn?.trim() || fullNameAr.trim(),
        nationality: nationality?.trim() || "مواطن",
        phone: phone.trim(),
        whatsapp: (whatsapp?.trim() || phone.trim()),
        email: email.trim().toLowerCase(),
        city: city?.trim() || null,
        residenceCountry: residenceCountry?.trim() || "Egypt",
        passportNumberEnc: encryptPassport(
          passportNumber?.trim() || "P" + Math.floor(1000000 + Math.random() * 9000000)
        ),
        lastCertificate: lastCertificate?.trim() || null,
        gpa: gpa?.trim() || null,
        previousMajor: previousMajor?.trim() || null,
        languageLevel: languageLevel?.trim() || null,
        ieltsToeflScore: ieltsToeflScore?.trim() || null,
        desiredMajor: desiredMajor?.trim() || "عام",
        desiredCountry: desiredCountry?.trim() || "Spain",
        targetLevel: targetLevel?.trim() || "bachelor",
        budget: budget ? parseFloat(budget) : 5000,
        budgetCurrency: budgetCurrency?.trim() || "USD",
        intake: intake?.trim() || "Fall 2026",
        branchId: targetBranchId,
        counselorId: counselorId || session.userId,
        leadSourceId: leadSourceId || null,
        status: status || "new",
        notes: notes?.trim() || null,
        customFieldsData: customFieldsData ? JSON.stringify(customFieldsData) : null,
        createdBy: session.userId,
      },
    });

    // Create initial timeline event
    await prisma.timelineEvent.create({
      data: {
        studentId: student.id,
        category: "status_change",
        titleAr: "تسجيل ملف طالب جديد",
        titleEn: "New student registered",
        description: `تم إنشاء الملف برقم كودي ${studentCode} بواسطة ${session.name}`,
        color: "blue",
        actorName: session.name || "System",
        actorId: session.userId,
      },
    });

    // Audit log
    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "Student",
      entityId: student.id,
      details: `تسجيل طالب جديد: ${student.fullNameAr} (${student.studentCode})`,
      newValue: student,
    });

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: "فشل إنشاء ملف الطالب في النظام" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canEdit = session.roleName === "admin" || (await hasPermission("edit", "students"));
    if (!canEdit) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل الطلاب" }, { status: 403 });
    }

    const body = await req.json();
    const { studentIds, data } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !data) {
      return NextResponse.json({ error: "الرجاء تحديد الطلاب والبيانات المراد تعديلها" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.counselorId) updateData.counselorId = data.counselorId;
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null;
    if (data.targetLevel) updateData.targetLevel = data.targetLevel;
    if (data.desiredCountry) updateData.desiredCountry = data.desiredCountry;

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds }, deletedAt: null },
      data: updateData,
    });

    if (data.status) {
      for (const sId of studentIds) {
        await prisma.timelineEvent.create({
          data: {
            studentId: sId,
            category: "status_change",
            titleAr: `تحديث جماعي للحالة: ${data.status}`,
            titleEn: `Bulk status update: ${data.status}`,
            description: `تم التحديث بواسطة ${session.name}`,
            color: "indigo",
            actorName: session.name || "System",
            actorId: session.userId,
          },
        });
      }
    }

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "update",
      entity: "Student",
      details: `تحديث جماعي لعدد ${result.count} طالب`,
      newValue: updateData,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk update students error:", error);
    return NextResponse.json({ error: "فشل التحديث الجماعي للطلاب" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بالدخول" }, { status: 401 });
    }

    const canDelete = session.roleName === "admin" || (await hasPermission("delete", "students"));
    if (!canDelete) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف الطلاب" }, { status: 403 });
    }

    const body = await req.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "الرجاء تحديد الطلاب المراد حذفهم" }, { status: 400 });
    }

    const result = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "delete",
      entity: "Student",
      details: `حذف جماعي لعدد ${result.count} طالب`,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk delete students error:", error);
    return NextResponse.json({ error: "فشل الحذف الجماعي للطلاب" }, { status: 500 });
  }
}
