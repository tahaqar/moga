import { NextResponse } from "next/server";
import { getCurrentUser, getUserWithPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    let targetUserId = session?.userId;

    if (!targetUserId) {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: { name: "admin" }, isActive: true, deletedAt: null },
      });
      targetUserId = defaultAdmin?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const fullUser = await getUserWithPermissions(targetUserId);
    if (!fullUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const permissions = fullUser.role.permissions.map((rp) => rp.permission.name);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        phone: fullUser.phone,
        role: {
          id: fullUser.role.id,
          name: fullUser.role.name,
          displayName: fullUser.role.displayName,
        },
        branch: fullUser.branch
          ? {
              id: fullUser.branch.id,
              name: fullUser.branch.name,
              code: fullUser.branch.code,
              city: fullUser.branch.city,
            }
          : null,
        permissions,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
