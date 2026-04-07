import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({ 
        success: false, 
        error: "Unauthorized: Organization ID not found in token" 
      }, { status: 401 });
    }

    const id = parseInt(params.id);

    const sales = await prisma.secondHandSale.findUnique({
      where: { second_hand_sales_id: id },
      include: {
        items: {
          include: {
            goods: true,
            service: true,
            unit: true,
          }
        },
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true,
          }
        },
        currency_info: true,
        organization: {
          include: {
            businessDetails: true,
            governmentAgencyDetail: true,
            corporationDetail: true,
            csoDetail: true,
          }
        },
      }
    });

    if (!sales) {
      return Response.json({ 
        success: false, 
        error: "Second hand sales not found" 
      }, { status: 404 });
    }

    // Verify that the sales belongs to user's organization
    if (sales.organization_id !== organizationId) {
      return Response.json({ 
        success: false, 
        error: "Unauthorized: You don't have access to this sales record" 
      }, { status: 403 });
    }

    return Response.json({ 
      success: true, 
      data: sales 
    });

  } catch (error) {
    console.error("Error fetching second hand sales:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}