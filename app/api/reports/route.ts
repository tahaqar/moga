import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const studentsByCountry = await prisma.application.groupBy({
      by: ["countryId"],
      _count: { id: true },
    });

    const countries = await prisma.country.findMany();
    const countryData = studentsByCountry.map((item) => {
      const c = countries.find((x) => x.id === item.countryId);
      return {
        nameAr: c?.nameAr || "أخرى",
        count: item._count.id,
      };
    });

    const studentsByStatus = await prisma.student.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return NextResponse.json({ countryData, studentsByStatus });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
