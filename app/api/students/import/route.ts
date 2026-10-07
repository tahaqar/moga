import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { encryptPassport } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const canCreate = session.roleName === "admin" || (await hasPermission("create", "students"));
    if (!canCreate) {
      return NextResponse.json({ error: "لا تملك صلاحية استيراد الطلاب" }, { status: 403 });
    }

    const body = await req.json();
    const rows: any[] = body.students || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على بيانات لاستيرادها" }, { status: 400 });
    }

    let successCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const createdStudents: any[] = [];

    // Get baseline student count for generating sequential codes
    const existingCount = await prisma.student.count();
    let currentCounter = existingCount + 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fullNameAr = row.fullNameAr || row["الاسم بالعربية"] || row["الاسم"] || row["fullName"] || row["Name"];
      const fullNameEn = row.fullNameEn || row["الاسم بالإنجليزية"] || row["Name En"] || fullNameAr;
      const phone = String(row.phone || row["الهاتف"] || row["رقم الهاتف"] || row["Phone"] || "").trim();
      const email = String(row.email || row["البريد الإلكتروني"] || row["البريد"] || row["Email"] || "").trim().toLowerCase();

      if (!fullNameAr || !phone) {
        skippedCount++;
        errors.push(`صف ${i + 1}: الاسم ورقم الهاتف مطلوبان`);
        continue;
      }

      // Check duplicate
      const duplicate = await prisma.student.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { phone },
            ...(email && email.includes("@") ? [{ email }] : []),
          ],
        },
      });

      if (duplicate) {
        skippedCount++;
        errors.push(`صف ${i + 1} (${fullNameAr}): طالب مسجل مسبقاً بنفس الهاتف أو البريد`);
        continue;
      }

      const studentCode = `AML-2026-${String(currentCounter++).padStart(3, "0")}`;
      const passportNumber = row.passportNumber || row["رقم الجواز"] || row["Passport"] || `P${Math.floor(1000000 + Math.random() * 9000000)}`;

      const desiredCountry = row.desiredCountry || row["الدولة المستهدفة"] || row["الدولة"] || "Spain";
      const desiredMajor = row.desiredMajor || row["التخصص المطلوب"] || row["التخصص"] || "عام";
      const targetLevel = row.targetLevel || row["المرحلة"] || row["المستوى"] || "bachelor";
      const status = row.status || row["الحالة"] || "new";
      const nationality = row.nationality || row["الجنسية"] || "مواطن";
      const budget = row.budget || row["الميزانية"] ? parseFloat(row.budget || row["الميزانية"]) : 5000;
      const notes = row.notes || row["الملاحظات"] || "تم الاستيراد من ملف Excel";

      const student = await prisma.student.create({
        data: {
          studentCode,
          fullNameAr: String(fullNameAr).trim(),
          fullNameEn: String(fullNameEn).trim(),
          nationality: String(nationality).trim(),
          residenceCountry: String(row.residenceCountry || row["بلد الإقامة"] || "Saudi Arabia").trim(),
          phone,
          whatsapp: phone,
          email: email && email.includes("@") ? email : `student.${studentCode.toLowerCase()}@amalon.local`,
          desiredCountry: String(desiredCountry).trim(),
          desiredMajor: String(desiredMajor).trim(),
          targetLevel: String(targetLevel).trim(),
          status: String(status).trim(),
          budget,
          budgetCurrency: "USD",
          intake: "Fall 2026",
          passportNumberEnc: encryptPassport(passportNumber),
          branchId: session.branchId || null,
          counselorId: session.userId,
          notes,
          createdBy: session.userId,
        },
      });

      await prisma.timelineEvent.create({
        data: {
          studentId: student.id,
          category: "status_change",
          titleAr: "استيراد ملف الطالب من ملف خارجي",
          titleEn: "Student imported from file",
          description: `تم استيراد الطالب بواسطة ${session.name}`,
          color: "blue",
          actorName: session.name,
          actorId: session.userId,
        },
      });

      createdStudents.push({
        id: student.id,
        studentCode: student.studentCode,
        fullNameAr: student.fullNameAr,
      });
      successCount++;
    }

    await logAudit({
      userId: session.userId,
      userName: session.name,
      action: "create",
      entity: "Student",
      details: `استيراد جماعي للطلاب: تم إدخال ${successCount} طالب، وتخطي ${skippedCount}`,
    });

    return NextResponse.json({
      success: true,
      importedCount: successCount,
      skippedCount,
      errors,
      students: createdStudents,
    });
  } catch (error) {
    console.error("Import students error:", error);
    return NextResponse.json({ error: "فشل استيراد بيانات الطلاب" }, { status: 500 });
  }
}
