import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - List adjustments with pagination, search, and filters
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
    const sortBy = searchParams.get("sortBy") || "adjustment_id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Search & Filters
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const invoiceNo = searchParams.get("invoice_no");

    // Base where - always filter by organizationId from JWT
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId // Filter by user's organization
    };

    const conditions = [];

    // 🔍 Search logic (Sales-style)
    if (search) {
      conditions.push(
        { adjustment_note_no: { contains: search } },
        { invoice_no: { contains: search } },
        { customer_name: { contains: search } },
        { customer_tpn: { contains: search } }
      );

      // Numeric search
      const numericValue = Number(search);
      if (!isNaN(numericValue)) {
        const min = numericValue;
        const max = numericValue + 0.999999;

        conditions.push(
          { adjustment_id: { gte: min, lte: max } },
          { total_adjustment_amount: { gte: min, lte: max } },
          { sales_amount: { gte: min, lte: max } },
          { gst_amount: { gte: min, lte: max } }
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

    if (invoiceNo) {
      where.invoice_no = { contains: invoiceNo };
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate + "T00:00:00");
      }
      if (endDate) {
        where.date.lte = new Date(endDate + "T23:59:59");
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

    // Total count
    const total = await prisma.adjustment.count({ where });

    // Fetch adjustments
    const adjustments = await prisma.adjustment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        invoice: true,
        customer:{
            include: {
                businessParty: true,
                governmentAgencyParty: true,
                corporationParty: true,
                csoParty: true,
                individualParty: true
            }
        },
        adjustmentItems: {
          select: {
            adjustment_type: true,
            adjustment_amount: true
          }
        }
      }
    });

    // Transform data (summary like sales)
    const data = adjustments.map(adjustment => {
      const creditAdjustments = adjustment.adjustmentItems
        .filter(i => i.adjustment_type === "CREDIT")
        .reduce((sum, i) => sum + Number(i.adjustment_amount), 0);

      const debitAdjustments = adjustment.adjustmentItems
        .filter(i => i.adjustment_type === "DEBIT")
        .reduce((sum, i) => sum + Number(i.adjustment_amount), 0);

      return {
        adjustment_id: adjustment.adjustment_id,
        adjustment_note_no: adjustment.adjustment_note_no,
        date: adjustment.date.toISOString().split("T")[0],

        customer_id: adjustment.customer_id,
        customer_name: adjustment.customer_name || "",
        customer_tpn: adjustment.customer_tpn || "",

        sale_id: adjustment.sale_id,
        invoice_no: adjustment.invoice_no,

        sales_amount: Number(adjustment.sales_amount),
        exempt_amount: Number(adjustment.exempt_amount),
        taxable_amount: Number(adjustment.taxable_amount),
        gst_amount: Number(adjustment.gst_amount),
        total_invoice_amount: Number(adjustment.total_invoice_amount),
        total_adjustment_amount: Number(adjustment.total_adjustment_amount),
        effect_on_gst_payable: Number(adjustment.effect_on_gst_payable),

        status: adjustment.status,
        created_by: adjustment.created_by,
        created_on: adjustment.created_on.toISOString().split("T")[0],

        invoice_sales_invoice_no: adjustment.invoice?.sales_invoice_no || "",
        invoice_sales_date: adjustment.invoice?.sales_date
          ? adjustment.invoice.sales_date.toISOString().split("T")[0]
          : "",
        invoice_sales_amount: Number(adjustment.invoice?.sales_amount || 0),
        customer: adjustment.customer ,

        summary: {
          itemsCount: adjustment.adjustmentItems.length,
          creditAdjustments,
          debitAdjustments,
          netAdjustment: creditAdjustments - debitAdjustments,
          hasCredit: creditAdjustments > 0,
          hasDebit: debitAdjustments > 0
        }
      };
    });

    return Response.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching adjustments:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch adjustments"
      },
      { status: 500 }
    );
  }
}
