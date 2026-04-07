import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const purchase_id = searchParams.get('purchase_id');
    
    let whereClause = {
      organization_id: organizationId
    };
    
    if (purchase_id) {
      whereClause.purchase_id = parseInt(purchase_id);
    }
    
    const stockItems = await prisma.secondHandStockItem.findMany({
      where: whereClause,
      include: {
        goods: true,
        service: true,
        unit: true,
        purchase: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        stock_item_id: 'desc'
      }
    });
    
    return Response.json({
      success: true,
      data: stockItems
    });
    
  } catch (error) {
    console.error("Error fetching stock items:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}