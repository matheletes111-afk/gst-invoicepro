import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest, isSuperAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    const search = searchParams.get("search") || "";

    let where = {
      organizationId: organizationId // Filter by user's organization
    };

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            orgType: true,
            businessDetails: {
              select: {
                businessName: true
              }
            },
            governmentAgencyDetail: {
              select: {
                agencyName: true
              }
            },
            corporationDetail: {
              select: {
                corporationName: true
              }
            },
            csoDetail: {
              select: {
                agencyName: true
              }
            }
          }
        }
      }
    });

    // Transform data to include organization name and role
    const transformedUsers = users.map(user => {
      let organizationName = "";
      switch (user.organization.orgType) {
        case "business":
          organizationName = user.organization.businessDetails?.businessName || "";
          break;
        case "government":
          organizationName = user.organization.governmentAgencyDetail?.agencyName || "";
          break;
        case "corporation":
          organizationName = user.organization.corporationDetail?.corporationName || "";
          break;
        case "cso":
          organizationName = user.organization.csoDetail?.agencyName || "";
          break;
      }

      // Check if user is super admin
      const role = isSuperAdmin(user.email) ? "Admin" : "User";

      return {
        id: user.id,
        name: user.name || "N/A",
        email: user.email,
        organizationId: user.organizationId,
        organizationName: organizationName,
        role: role,
        createdAt: user.createdAt
      };
    });

    return Response.json({
      success: true,
      users: transformedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("List users error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

