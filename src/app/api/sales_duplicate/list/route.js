import prisma from "@/lib/prisma";

// GET - List sales with pagination, search, and filters
export async function GET(req) {
  try {
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
    const organizationId = searchParams.get("organization_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build where clause
    let where = {
      status: { not: "D" } // Exclude deleted
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
      const numericValue = parseFloat(search);
      if (!isNaN(numericValue)) {
        conditions.push(
          { sales_id: { equals: numericValue } },
          { sales_amount: { equals: numericValue } },
          { exempt_amount: { equals: numericValue } },
          { taxable_amount: { equals: numericValue } }
        );
      }

     
    }

    // Apply filters
    if (statusFilter) {
      where.status = statusFilter;
    }

    if (customerId) {
      where.customer_id = parseInt(customerId);
    }

    if (organizationId) {
      where.organization_id = parseInt(organizationId);
    }

    // Date range filter
    if (startDate || endDate) {
      where.sales_date = {};
      if (startDate) {
        where.sales_date.gte = new Date(startDate);
      }
      if (endDate) {
        where.sales_date.lte = new Date(endDate);
      }
    }

    // Combine search conditions
    if (conditions.length > 0) {
      where.AND = [
        { status: { not: "D" } },
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
