import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get("branchId");

    // Build branch where clause
    const branchWhere =
      branchFilter && branchFilter !== "all"
        ? { branchId: branchFilter }
        : session.roleName === "admin"
        ? {}
        : session.branchId
        ? { branchId: session.branchId }
        : {};

    const studentWhere = { deletedAt: null, ...branchWhere };

    // Fetch dashboard counters in parallel
    const [
      totalStudents,
      newStudents,
      inProgressApps,
      acceptedApps,
      visasIssued,
      visaFiles,
      travelledStudents,
      universitiesCount,
      employeesCount,
      branchesCount,
      payments,
      contracts,
      commissions,
      todayTasks,
      upcomingVisas,
      studentsByCountryRaw,
      studentsByLevelRaw,
    ] = await Promise.all([
      // Total students
      prisma.student.count({ where: studentWhere }),

      // New students
      prisma.student.count({ where: { ...studentWhere, status: "new" } }),

      // In progress applications
      prisma.application.count({
        where: {
          deletedAt: null,
          student: studentWhere,
          status: { in: ["submitted", "in_progress"] },
        },
      }),

      // Accepted applications
      prisma.application.count({
        where: {
          deletedAt: null,
          student: studentWhere,
          status: "accepted",
        },
      }),

      // Visas issued
      prisma.visaCase.count({
        where: {
          deletedAt: null,
          student: studentWhere,
          status: "approved",
        },
      }),

      // Visa files in process
      prisma.visaCase.count({
        where: {
          deletedAt: null,
          student: studentWhere,
        },
      }),

      // Travelled
      prisma.student.count({
        where: { ...studentWhere, status: { in: ["travelled", "arrived"] } },
      }),

      // Universities / Partners
      prisma.university.count({ where: { isActive: true, deletedAt: null } }),

      // Employees
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),

      // Branches
      prisma.branch.count({ where: { isActive: true, deletedAt: null } }),

      // Payments for total collected
      prisma.payment.findMany({
        where: { deletedAt: null, student: studentWhere },
        select: { baseAmount: true },
      }),

      // Contracts for total and remaining
      prisma.contract.findMany({
        where: { deletedAt: null, student: studentWhere },
        select: { totalAmount: true, paidAmount: true, remainingAmount: true },
      }),

      // Commissions
      prisma.universityCommission.findMany({
        where: { deletedAt: null, application: { student: studentWhere } },
        select: { commissionAmount: true, amountReceived: true, status: true },
      }),

      // Today's & pending tasks
      prisma.task.findMany({
        where: {
          deletedAt: null,
          status: { in: ["pending", "in_progress"] },
          ...(session.roleName === "counselor" ? { assigneeId: session.userId } : {}),
        },
        include: {
          student: { select: { id: true, fullNameAr: true, studentCode: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 6,
      }),

      // Upcoming embassy appointments
      prisma.visaCase.findMany({
        where: {
          deletedAt: null,
          appointmentDate: { not: null },
          student: studentWhere,
        },
        include: {
          student: { select: { id: true, fullNameAr: true, studentCode: true, phone: true } },
          country: { select: { nameAr: true, flagEmoji: true } },
        },
        orderBy: { appointmentDate: "asc" },
        take: 5,
      }),

      // Students by country distribution
      prisma.application.groupBy({
        by: ["countryId"],
        where: { deletedAt: null, student: studentWhere },
        _count: { id: true },
      }),

      // Students by level distribution
      prisma.application.groupBy({
        by: ["level"],
        where: { deletedAt: null, student: studentWhere },
        _count: { id: true },
      }),
    ]);

    // Financial sums in USD base currency
    const totalCollected = payments.reduce((acc, p) => acc + (p.baseAmount || 0), 0);
    const totalRemaining = contracts.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);

    // Unreceived commissions sum
    const unreceivedCommissions = commissions
      .filter((c) => c.status !== "received")
      .reduce((acc, c) => acc + (c.commissionAmount - c.amountReceived), 0);

    // Format countries data
    const countryIds = studentsByCountryRaw.map((s) => s.countryId);
    const countries = await prisma.country.findMany({
      where: { id: { in: countryIds } },
      select: { id: true, nameAr: true, nameEn: true, flagEmoji: true },
    });

    const countryStats = studentsByCountryRaw.map((item) => {
      const country = countries.find((c) => c.id === item.countryId);
      return {
        countryId: item.countryId,
        nameAr: country?.nameAr || "غير محدد",
        nameEn: country?.nameEn || "Unknown",
        flagEmoji: country?.flagEmoji || "🌐",
        count: item._count.id,
      };
    });

    return NextResponse.json({
      counters: {
        totalStudents,
        newStudents,
        inProgressApps,
        acceptedApps,
        visaFiles,
        visasIssued,
        travelledStudents,
        totalCollected,
        totalRemaining,
        universitiesCount,
        employeesCount,
        branchesCount,
        unreceivedCommissions,
      },
      countryStats,
      levelStats: studentsByLevelRaw.map((l) => ({
        level: l.level,
        count: l._count.id,
      })),
      todayTasks,
      upcomingVisas,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
