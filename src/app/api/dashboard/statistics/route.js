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

    // Get total sales count for current month
    const totalSales = await prisma.sales.count({
      where: {
        organization_id: organizationId,
        status: { not: "D" },
        sales_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Get distinct customer count for current month
    const distinctCustomers = await prisma.sales.findMany({
      where: {
        organization_id: organizationId,
        status: { not: "D" },
        sales_date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        customer_id: true
      },
      distinct: ['customer_id']
    });
    const totalCustomers = distinctCustomers.length;

    // Get total products (goods) count for this organization
    const totalProducts = await prisma.GoodsCatalog.count({
      where: {
        organizationId: organizationId
      }
    });

    // Get total services count for this organization
    const totalServices = await prisma.ServiceCatalog.count({
      where: {
        organizationId: organizationId
      }
    });

    return Response.json({
      success: true,
      data: {
        totalSales,
        totalCustomers,
        totalProducts,
        totalServices
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

