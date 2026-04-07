import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest, isSuperAdminFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    // Check if user is super admin
    const isAdmin = await isSuperAdminFromRequest(request);

    // Get organizationId from JWT token (even if super admin, we still need it for non-admin check)
    const organizationId = await getOrganizationIdFromRequest(request);

    if (!organizationId && !isAdmin) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "id";
    const sortDir = searchParams.get("sortDir") || "desc";

    const search = searchParams.get("search") || "";
    const orgType = searchParams.get("orgType") || "";

    // Build where clause - super admin sees all, regular users only see their own
    let where = {
      isDeleted: 0, // Use 0 instead of false since it's an Int field
    };

    // If not super admin, filter by user's organization
    if (!isAdmin) {
      where.id = organizationId;
    }

    // Apply orgType filter if selected
    if (orgType) {
      where.orgType = orgType;
    }

    // Apply search only if user typed something
    if (search.trim() !== "") {
      const searchConditions = {
        OR: [
          { businessDetails: { businessName: { contains: search, mode: "insensitive" } } },
          { governmentAgencyDetail: { agencyName: { contains: search, mode: "insensitive" } } },
          { corporationDetail: { corporationName: { contains: search, mode: "insensitive" } } },
          { csoDetail: { agencyName: { contains: search, mode: "insensitive" } } },
        ]
      };

      // Build base conditions
      const baseConditions = { isDeleted: 0 };
      if (where.id) {
        baseConditions.id = where.id; // Non-admin: include id filter
      }
      if (where.orgType) {
        baseConditions.orgType = where.orgType;
      }

      // Combine base conditions with search using AND
      where = {
        AND: [
          baseConditions,
          searchConditions
        ]
      };
    }

    // Debug: Log the where clause
    console.log("Where clause for count (isAdmin:", isAdmin, "):", JSON.stringify(where, null, 2));

    const total = await prisma.organization.count({ where });

    const organizations = await prisma.organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        businessDetails: true,
        governmentAgencyDetail: true,
        corporationDetail: true,
        csoDetail: true,
      }
    });

    // Transform data for frontend
    const transformedOrgs = organizations.map(org => {
      let details = {};
      let name = "";
      let code = "";

      switch (org.orgType) {
        case "business":
          details = org.businessDetails;
          name = org.businessDetails?.businessName || "";
          code = org.businessDetails?.businessNameCode || "";
          break;
        case "government":
          details = org.governmentAgencyDetail;
          name = org.governmentAgencyDetail?.agencyName || "";
          code = org.governmentAgencyDetail?.agencyCode || "";
          break;
        case "corporation":
          details = org.corporationDetail;
          name = org.corporationDetail?.corporationName || "";
          code = org.corporationDetail?.organizationCode || "";
          break;
        case "cso":
          details = org.csoDetail;
          name = org.csoDetail?.agencyName || "";
          code = org.csoDetail?.agencyCode || "";
          break;
      }

      return {
        id: org.id,
        orgType: org.orgType,
        name,
        code,
        status: org.status,
        isDeleted: org.isDeleted, // This will be 0 or 1
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        details: details
      };
    });

    return Response.json({
      success: true,
      organizations: transformedOrgs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Soft delete organization
export async function DELETE(req) {
  try {
    const body = await req.json();

    // Log activity
    try {
      const user = await getUserFromRequest(req);

      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        const { default: prisma } = await import('@/lib/prisma');

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'DELETE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: body,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    const { id } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    const orgId = parseInt(id);

    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!existingOrg) {
      return Response.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    if (existingOrg.isDeleted === 1) {
      return Response.json(
        { success: false, error: "Organization already deleted" },
        { status: 400 }
      );
    }

    // Soft delete = set isDeleted to 1
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        isDeleted: 1, // Set to 1 instead of true
        status: 'I' // Optionally also set status to Inactive
      },
    });

    return Response.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

