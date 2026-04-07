import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest, isSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const requesterOrgId = await getOrganizationIdFromRequest(req);
    if (!requesterOrgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Organization ID not found in token" },
        { status: 401 }
      );
    }

    const isAdmin = await isSuperAdminFromRequest(req);
    const orgId = Number(params.id);

    if (!Number.isFinite(orgId)) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!isAdmin && orgId !== requesterOrgId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only access your own organization" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();

    /** @type {import("@prisma/client").Prisma.UserWhereInput} */
    const where = { organizationId: orgId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        createdAt: true,
        organizationId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching organization users:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

