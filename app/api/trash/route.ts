import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const [
      students,
      applications,
      universities,
      tasks,
      payments,
      contracts,
      commissions,
      communications,
      templates,
      users,
      countries,
      documents,
      visaCases,
      leadSources,
    ] = await Promise.all([
      prisma.student.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, studentCode: true, fullNameAr: true, deletedAt: true },
      }),
      prisma.application.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, applicationCode: true, deletedAt: true },
      }),
      prisma.university.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nameAr: true, nameEn: true, deletedAt: true },
      }),
      prisma.task.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true },
      }),
      prisma.payment.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, receiptNumber: true, amount: true, currency: true, deletedAt: true },
      }),
      prisma.contract.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, contractNumber: true, totalAmount: true, currency: true, deletedAt: true },
      }),
      prisma.universityCommission.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, referenceNumber: true, commissionAmount: true, currency: true, deletedAt: true },
      }),
      prisma.communication.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, subject: true, type: true, deletedAt: true },
      }),
      prisma.messageTemplate.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nameAr: true, code: true, deletedAt: true },
      }),
      prisma.user.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, email: true, deletedAt: true },
      }),
      prisma.country.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nameAr: true, code: true, deletedAt: true },
      }),
      prisma.studentDocument.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, fileName: true, deletedAt: true },
      }),
      prisma.visaCase.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, caseNumber: true, embassyLocation: true, deletedAt: true },
      }),
      prisma.leadSource.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nameAr: true, code: true, deletedAt: true },
      }),
    ]);

    const items = [
      ...students.map((s) => ({ id: s.id, entity: "Student", label: `${s.fullNameAr} (${s.studentCode})`, deletedAt: s.deletedAt })),
      ...applications.map((a) => ({ id: a.id, entity: "Application", label: `طلب تقديم (${a.applicationCode})`, deletedAt: a.deletedAt })),
      ...universities.map((u) => ({ id: u.id, entity: "University", label: u.nameAr, deletedAt: u.deletedAt })),
      ...tasks.map((t) => ({ id: t.id, entity: "Task", label: t.title, deletedAt: t.deletedAt })),
      ...payments.map((p) => ({ id: p.id, entity: "Payment", label: `سند قبض (${p.receiptNumber}) - ${p.amount} ${p.currency}`, deletedAt: p.deletedAt })),
      ...contracts.map((c) => ({ id: c.id, entity: "Contract", label: `عقد مالي (${c.contractNumber}) - ${c.totalAmount} ${c.currency}`, deletedAt: c.deletedAt })),
      ...commissions.map((cm) => ({ id: cm.id, entity: "UniversityCommission", label: `عمولة جامعية (${cm.referenceNumber}) - ${cm.commissionAmount} ${cm.currency}`, deletedAt: cm.deletedAt })),
      ...communications.map((co) => ({ id: co.id, entity: "Communication", label: `محادثة (${co.type}) - ${co.subject || "بدون موضوع"}`, deletedAt: co.deletedAt })),
      ...templates.map((tpl) => ({ id: tpl.id, entity: "MessageTemplate", label: `قالب رسالة: ${tpl.nameAr} (${tpl.code})`, deletedAt: tpl.deletedAt })),
      ...users.map((u) => ({ id: u.id, entity: "User", label: `موظف: ${u.name} (${u.email})`, deletedAt: u.deletedAt })),
      ...countries.map((ct) => ({ id: ct.id, entity: "Country", label: `دولة: ${ct.nameAr} (${ct.code})`, deletedAt: ct.deletedAt })),
      ...documents.map((d) => ({ id: d.id, entity: "StudentDocument", label: `مستند: ${d.title || d.fileName}`, deletedAt: d.deletedAt })),
      ...visaCases.map((v) => ({ id: v.id, entity: "VisaCase", label: `تأشيرة (${v.caseNumber}) - سفارة ${v.embassyLocation}`, deletedAt: v.deletedAt })),
      ...leadSources.map((ls) => ({ id: ls.id, entity: "LeadSource", label: `مصدر طلاب: ${ls.nameAr} (${ls.code})`, deletedAt: ls.deletedAt })),
    ];

    items.sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get trash error:", error);
    return NextResponse.json({ error: "Failed to load trash" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();
    const { id, entity } = body;

    if (!id || !entity) {
      return NextResponse.json({ error: "Id and entity are required" }, { status: 400 });
    }

    const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
    const client = (prisma as any)[modelName];

    if (!client) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const restored = await client.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "restore",
      entity,
      entityId: id,
    });

    return NextResponse.json({ success: true, restored });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Failed to restore item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const entity = searchParams.get("entity");

    if (!id || !entity) {
      return NextResponse.json({ error: "Id and entity are required" }, { status: 400 });
    }

    const modelName = entity.charAt(0).toLowerCase() + entity.slice(1);
    const client = (prisma as any)[modelName];

    if (!client) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    await client.delete({ where: { id } });

    await logAudit({
      userId: session?.userId,
      userName: session?.name,
      action: "delete",
      entity,
      entityId: id,
      details: "Permanent delete from trash",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permanent delete error:", error);
    return NextResponse.json({ error: "Failed to permanently delete item" }, { status: 500 });
  }
}
