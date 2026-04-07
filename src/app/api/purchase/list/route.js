import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

// GET - List purchases with pagination, search, and filters
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

    // Pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get("sortBy") || "purchase_id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Search and Filters
    const search = searchParams.get("search") || "";
    const supplierId = searchParams.get("supplier_id");
    const dealerId = searchParams.get("dealer_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build where clause - always filter by organizationId from JWT
    let where = {
      organization_id: organizationId // Filter by user's organization
    };

    const conditions = [];

    // Search in multiple fields
    if (search) {
      conditions.push(
        { purchase_order_no: { contains: search } }
      );

      // Numeric search
      const numericValue = Number(search);

      if (!isNaN(numericValue)) {
        const min = numericValue;
        const max = numericValue + 0.999999;

        conditions.push(
          { purchase_id: { gte: min, lte: max } },
          { sales_amount: { gte: min, lte: max } },
          { exempt_amount: { gte: min, lte: max } },
          { taxable_amount: { gte: min, lte: max } },
          { gst_amount: { gte: min, lte: max } },
          { total_invoice_amount: { gte: min, lte: max } }
        );
      }

      // Search in supplier name (through relation)
      if (search.trim()) {
        where.OR = [
          ...(where.OR || []),
          {
            supplier: {
              supplierName: { contains: search }
            }
          },
          {
            dealer: {
              dealerName: { contains: search }
            }
          },
          {
            supplier: {
              taxpayerRegNo: { contains: search }
            }
          },
          {
            dealer: {
              taxpayerRegNo: { contains: search }
            }
          },
          {
            supplier: {
              businessLicenseNo: { contains: search }
            }
          },
          {
            dealer: {
              businessLicenseNo: { contains: search }
            }
          }
        ];
      }
    }

    // Apply filters
    if (supplierId) {
      where.supplier_id = parseInt(supplierId);
    }

    if (dealerId) {
      where.dealer_id = parseInt(dealerId);
    }

    // Date range filter
    if (startDate || endDate) {
      where.purchase_date = {};

      if (startDate) {
        where.purchase_date.gte = new Date(startDate + "T00:00:00");
      }

      if (endDate) {
        where.purchase_date.lte = new Date(endDate + "T23:59:59");
      }
    }

    // Combine search conditions
    if (conditions.length > 0) {
      where.AND = [
        { organization_id: organizationId },
        { OR: conditions }
      ];
    }

    // Get total count with where clause
    const total = await prisma.purchase.count({ where });

    // Get purchases with relations
    const purchases = await prisma.purchase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        supplier: {
          select: {
            supplierId: true,
            supplierName: true,
            taxpayerRegNo: true,
            businessLicenseNo: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true
          }
        },
        dealer: {
          select: {
            dealerId: true,
            dealerName: true,
            taxpayerRegNo: true,
            businessLicenseNo: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true
          }
        },
        currency_info: true,
        items: {
          include: {
            goods: {
              select: {
                goodsId: true,
                goodsName: true
              }
            },
            service: {
              select: {
                service_id: true,
                service_name: true
              }
            },
            unitObject: true
          }
        }
      }
    });

    // Transform data to include supplier_name and dealer_name for frontend
    const transformedPurchases = purchases.map(purchase => ({
      ...purchase,
      supplier_name: purchase.supplier?.supplierName || null,
      dealer_name: purchase.dealer?.dealerName || null,
      supplier_tpn: purchase.supplier?.taxpayerRegNo || null,
      dealer_tpn: purchase.dealer?.taxpayerRegNo || null
    }));

    return Response.json({
      success: true,
      data: transformedPurchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching purchases:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete purchase (hard delete since no status field)
export async function DELETE(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);

    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

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
    const { purchase_id } = body;

    if (!purchase_id) {
      return Response.json({
        success: false,
        error: "Purchase ID is required"
      }, { status: 400 });
    }

    const existingPurchase = await prisma.purchase.findUnique({
      where: { purchase_id: parseInt(purchase_id) }
    });

    if (!existingPurchase) {
      return Response.json({
        success: false,
        error: "Purchase not found"
      }, { status: 404 });
    }

    // Verify that the purchase belongs to user's organization
    if (existingPurchase.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this purchase record"
      }, { status: 403 });
    }

    // Since purchase model doesn't have status field, we need to delete items first (cascade)
    // Delete purchase items first due to foreign key constraint
    await prisma.purchaseItem.deleteMany({
      where: { purchase_id: parseInt(purchase_id) }
    });

    // Then delete the purchase
    await prisma.purchase.delete({
      where: { purchase_id: parseInt(purchase_id) }
    });

    return Response.json({
      success: true,
      message: "Purchase deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting purchase:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}