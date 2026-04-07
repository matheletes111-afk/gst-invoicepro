import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

// GET - List sales with pagination, search, and filters
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
    const sortBy = searchParams.get("sortBy") || "sales_id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Search and Filters
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build where clause - always filter by organizationId from JWT
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId // Filter by user's organization
    };

    const conditions = [];

    // Search in multiple fields
    if (search) {
      conditions.push(
        { sales_invoice_no: { contains: search, } },
        { customer_tpn: { contains: search, } },
        { customer_name: { contains: search, } }
      );

      // Numeric search
      // const numericValue = parseFloat(search);
      // if (!isNaN(numericValue)) {
      //   conditions.push(
      //     { sales_id: { equals: numericValue } },
      //     { sales_amount: { equals: numericValue } },
      //     { exempt_amount: { equals: numericValue } },
      //     { taxable_amount: { equals: numericValue } },
      //       { gst_amount: { equals: numericValue } }
      //   );
      // }

      const numericValue = Number(search)

      if (!isNaN(numericValue)) {
        const min = numericValue
        const max = numericValue + 0.999999

        conditions.push(
          { sales_id: { gte: min, lte: max } },
          { sales_amount: { gte: min, lte: max } },
          { exempt_amount: { gte: min, lte: max } },
          { taxable_amount: { gte: min, lte: max } },
          { gst_amount: { gte: min, lte: max } }
        )
      }


    }

    // Apply filters
    if (statusFilter) {
      where.status = statusFilter;
    }

    if (customerId) {
      where.customer_id = parseInt(customerId);
    }

    // Date range filter (Correct)
    if (startDate || endDate) {
      where.sales_date = {};

      if (startDate) {
        where.sales_date.gte = new Date(startDate + "T00:00:00");
      }

      if (endDate) {
        where.sales_date.lte = new Date(endDate + "T23:59:59");
      }
    }

    // Combine search conditions
    if (conditions.length > 0) {
      where.AND = [
        { status: { not: "D" } },
        { organization_id: organizationId },
        { OR: conditions }
      ];
    }

    // Get total count
    const total = await prisma.sales.count({ where });

    // Get sales with relations
    const sales = await prisma.sales.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        customer: true,
        currency_info: true,
        items: true,

      }
    });

    return Response.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Soft delete sales
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
    const { sales_id } = body;

    if (!sales_id) {
      return Response.json({
        success: false,
        error: "Sales ID is required"
      }, { status: 400 });
    }

    const existingSales = await prisma.sales.findUnique({
      where: { sales_id: parseInt(sales_id) }
    });

    if (!existingSales || existingSales.status === "D") {
      return Response.json({
        success: false,
        error: "Sales not found"
      }, { status: 404 });
    }

    // Verify that the sales belongs to user's organization
    if (existingSales.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this sales record"
      }, { status: 403 });
    }

    // Soft delete the sales
    const deletedSales = await prisma.sales.update({
      where: { sales_id: parseInt(sales_id) },
      data: {
        status: "D"
      }
    });

    return Response.json({
      success: true,
      message: "Sales deleted successfully",
      data: deletedSales
    });

  } catch (error) {
    console.error("Error deleting sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}