import prisma from "@/lib/prisma";
import { isSuperAdminFromRequest } from "@/lib/auth";

// GET - Get all organizations (super admin only, for user assignment)
export async function GET(req) {
  try {
    // Only super admin can access this endpoint
    const isAdmin = await isSuperAdminFromRequest(req);
    if (!isAdmin) {
      return Response.json({
        success: false,
        error: "Unauthorized: Only super admin can access this endpoint"
      }, { status: 403 });
    }

    // Get all active organizations (not deleted)
    const organizations = await prisma.organization.findMany({
      where: {
        isDeleted: 0,
        status: 'A' // Only active organizations
      },
      include: {
        businessDetails: true,
        governmentAgencyDetail: true,
        corporationDetail: true,
        csoDetail: true,
      },
      orderBy: { id: 'asc' }
    });

    // Transform data for dropdown
    const transformedOrgs = organizations.map(org => {
      let name = "";
      
      switch (org.orgType) {
        case "business":
          name = org.businessDetails?.businessName || `Business ${org.id}`;
          break;
        case "government":
          name = org.governmentAgencyDetail?.agencyName || `Government ${org.id}`;
          break;
        case "corporation":
          name = org.corporationDetail?.corporationName || `Corporation ${org.id}`;
          break;
        case "cso":
          name = org.csoDetail?.agencyName || `CSO ${org.id}`;
          break;
        default:
          name = `Organization ${org.id}`;
      }

      return {
        id: org.id,
        name,
        orgType: org.orgType
      };
    });

    return Response.json({
      success: true,
      organizations: transformedOrgs
    });
  } catch (error) {
    console.error("Error fetching all organizations:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

