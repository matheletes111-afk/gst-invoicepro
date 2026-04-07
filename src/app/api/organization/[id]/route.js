import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest, isSuperAdminFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({ 
        error: "Unauthorized: Organization ID not found in token" 
      }, { status: 401 });
    }

    const id = parseInt(params.id);

    // Verify that user is requesting their own organization (super admin can access any)
    const isAdmin = await isSuperAdminFromRequest(req);
    if (!isAdmin && id !== organizationId) {
      return Response.json({ 
        error: "Unauthorized: You can only access your own organization" 
      }, { status: 403 });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        businessDetails: true,
        governmentAgencyDetail: true,
        corporationDetail: true,
        csoDetail: true,
      }
    });

    if (!organization)
      return Response.json({ error: "Organization not found" }, { status: 404 });

    // Get the appropriate details based on orgType
    let details = null;
    switch (organization.orgType) {
      case "business":
        details = organization.businessDetails;
        break;
      case "government":
        details = organization.governmentAgencyDetail;
        break;
      case "corporation":
        details = organization.corporationDetail;
        break;
      case "cso":
        details = organization.csoDetail;
        break;
    }

    const response = {
      ...organization,
      details
    };

    return Response.json({ success: true, organization: response });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}