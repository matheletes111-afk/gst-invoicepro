import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

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

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all sales for this organization in the current month with items
    const sales = await prisma.sales.findMany({
      where: {
        organization_id: organizationId,
        status: { not: "D" },
        sales_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        items: {
          select: {
            goods_service_name: true,
            sales_item_type: true,
            quantity: true,
            goods_service_total_amount: true
          }
        }
      }
    });

    // Flatten items from all sales
    const salesItems = sales.flatMap(sale => sale.items);

    // Aggregate by goods/service name
    const aggregated = {};
    
    salesItems.forEach(item => {
      const name = item.goods_service_name || 'Unknown';
      if (!aggregated[name]) {
        aggregated[name] = {
          name: name,
          type: item.sales_item_type,
          totalQuantity: 0,
          totalAmount: 0
        };
      }
      aggregated[name].totalQuantity += parseFloat(item.quantity) || 0;
      aggregated[name].totalAmount += parseFloat(item.goods_service_total_amount) || 0;
    });

    // Convert to array and sort by total amount (descending)
    const sorted = Object.values(aggregated).sort((a, b) => b.totalAmount - a.totalAmount);

    // Get the best seller (first item)
    const bestSeller = sorted.length > 0 ? sorted[0] : null;

    // Calculate total sales for the month
    const totalSales = await prisma.sales.aggregate({
      where: {
        organization_id: organizationId,
        status: { not: "D" },
        sales_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        total_invoice_amount: true
      }
    });

    const totalSalesAmount = parseFloat(totalSales._sum.total_invoice_amount) || 0;
    const bestSellerAmount = bestSeller ? bestSeller.totalAmount : 0;
    const percentage = totalSalesAmount > 0 ? ((bestSellerAmount / totalSalesAmount) * 100).toFixed(1) : 0;

    return Response.json({
      success: true,
      data: {
        bestSeller: bestSeller ? {
          name: bestSeller.name,
          type: bestSeller.type,
          amount: bestSeller.totalAmount,
          quantity: bestSeller.totalQuantity
        } : null,
        totalSales: totalSalesAmount,
        percentage: parseFloat(percentage)
      }
    });

  } catch (error) {
    console.error("Error fetching best seller:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

