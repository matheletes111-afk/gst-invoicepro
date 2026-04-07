export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, isSuperAdmin } from "@/lib/auth";

/**
 * GET /api/auth/sidebar-access
 * Returns isSuperAdmin and allowed menu endpoints for the current user.
 * Super admin sees everything (client shows all items).
 * Other users get allowedEndpoints derived from their roles → RoleToPermission → MenuMaster.
 */
export async function GET(req) {
  try {
    const authUser = await getUserFromRequest(req);

    if (!authUser) {
      console.log("[Sidebar Access] Unauthorized: No authUser found in request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Sidebar Access] User ID: ${authUser.id}, Email: ${authUser.email}`);

    if (isSuperAdmin(authUser.email)) {
      return NextResponse.json({
        success: true,
        isSuperAdmin: true,
        allowedEndpoints: [],
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { roles: true },
    });

    console.log(`[Sidebar Access] DB User roles found: "${dbUser?.roles || ''}"`);

    if (!dbUser || !dbUser.roles || !dbUser.roles.trim()) {
      console.log("[Sidebar Access] User has no roles, returning empty allowedEndpoints");
      return NextResponse.json({
        success: true,
        isSuperAdmin: false,
        allowedEndpoints: [],
      });
    }

    const roleIds = dbUser.roles
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);

    if (roleIds.length === 0) {
      return NextResponse.json({
        success: true,
        isSuperAdmin: false,
        allowedEndpoints: [],
      });
    }

    const permissions = await prisma.RoleToPermission.findMany({
      where: { roleId: { in: roleIds } },
      select: { menuId: true },
      distinct: ["menuId"],
    });

    const menuIds = permissions.map((p) => p.menuId).filter(Boolean);

    if (menuIds.length === 0) {
      return NextResponse.json({
        success: true,
        isSuperAdmin: false,
        allowedEndpoints: [],
      });
    }

    const menus = await prisma.MenuMaster.findMany({
      where: { id: { in: menuIds } },
      select: { menuEndPoint: true },
    });

    const allowedEndpoints = menus
      .map((m) => m.menuEndPoint)
      .filter((ep) => ep != null && ep !== "");

    console.log(`[Sidebar Access] Returning ${allowedEndpoints.length} allowed endpoints`);

    return NextResponse.json({
      success: true,
      isSuperAdmin: false,
      allowedEndpoints,
    });
  } catch (error) {
    console.error("Error in sidebar-access:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
