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

    const purchase = await prisma.purchase.findUnique({
      where: { purchase_id: id },
      include: {
        items: {
          include: {
            goods: true,
            service: true,
            unitObject: true,
          },
          orderBy: { purchase_item_id: 'asc' }
        },
        supplier: true,
        dealer: true,
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

    if (!purchase) {
      return Response.json({ 
        success: false, 
        error: "Purchase not found" 
      }, { status: 404 });
    }

    // Verify that the purchase belongs to user's organization
    if (purchase.organization_id !== organizationId) {
      return Response.json({ 
        success: false, 
        error: "Unauthorized: You don't have access to this purchase record" 
      }, { status: 403 });
    }

    return Response.json({ 
      success: true, 
      data: purchase 
    });

  } catch (error) {
    console.error("Error fetching purchase:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}