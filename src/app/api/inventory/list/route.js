import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 1000;
    const skip = (page - 1) * limit;

    const where = {
      organization_id: organizationId,
      qty: { gt: 0 } // Only show items with stock
    };

    const [total, inventory] = await Promise.all([
      prisma.inventoryMaster.count({ where }),
      prisma.inventoryMaster.findMany({
        where,
        skip,
        take: limit,
        include: {
          goods: true,
          service: true,
          unit: true
        },
        orderBy: { id: 'desc' }
      })
    ]);

    // Format response
    const formattedData = inventory.map(item => ({
      id: item.id,
      goods_id: item.goods_id,
      service_id: item.service_id,
      goods_service_name: item.goods?.goodsName || item.service?.service_name,
      price: item.price,
      qty: item.qty,
      unit_id: item.unit_id,
      unit: item.unit,
      inventory_amount: item.inventory_amount
    }));

    return Response.json({
      success: true,
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching inventory:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}