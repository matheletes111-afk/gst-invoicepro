import prisma from "@/lib/prisma";

// GET - Search sales for specific customer with invoice filters
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const customerId = searchParams.get("customerId");
    const invoiceNumber = searchParams.get("invoiceNumber") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "sales_id";
    const sortDir = searchParams.get("sortDir") || "desc";

    if (!customerId) {
      return Response.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    let where = {
      status: { not: "D" },
      customer_id: parseInt(customerId),
    };

    const conditions = [];

    if (invoiceNumber.trim() !== "") {
      conditions.push({
        sales_invoice_no: { contains: invoiceNumber },
      });
    }

    if (startDate || endDate) {
      where.sales_date = {};

      if (startDate?.trim()) {
        where.sales_date.gte = new Date(startDate + "T00:00:00.000Z");
      }

      if (endDate?.trim()) {
        where.sales_date.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    if (conditions.length > 0) {
      where.AND = [
        { status: { not: "D" } },
        { customer_id: parseInt(customerId) },
        { OR: conditions },
      ];
    }

    const total = await prisma.sales.count({ where });

    const sales = await prisma.sales.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true,
          },
        },
        currency_info: true,
        items: {
          include: {
            goods: true,
            service: true,
            unitObject: true,
          },
          orderBy: { sales_item_id: "asc" },
        },
      },
    });

    /* ===============================
       ✅ FETCH ADJUSTMENT IDS
    =============================== */

    const saleIds = sales.map((s) => s.sales_id);

    const adjustments = await prisma.adjustment.findMany({
      where: {
        sale_id: { in: saleIds },
      },
      select: {
        sale_id: true,
        adjustment_id: true, // 👈 THIS is the ID you need
      },
    });

    // sale_id -> adjustment_id
    const adjustmentMap = new Map(
      adjustments.map((a) => [a.sale_id, a.adjustment_id])
    );

    /* ===============================
        FORMAT RESPONSE
    =============================== */

    const formattedSales = sales.map((sale) => {
      let customerDisplayName = sale.customer_name || "";

      if (sale.customer) {
        const party = sale.customer;
        if (party.individualParty) {
          customerDisplayName = `${party.individualParty.firstName || ""} ${party.individualParty.lastName || ""}`.trim();
        } else if (party.businessParty) {
          customerDisplayName = party.businessParty.businessName || "";
        } else if (party.corporationParty) {
          customerDisplayName = party.corporationParty.corporationName || "";
        } else if (party.csoParty) {
          customerDisplayName = party.csoParty.csoName || "";
        } else if (party.governmentAgencyParty) {
          customerDisplayName = party.governmentAgencyParty.agencyName || "";
        }
      }

      const adjustmentId = adjustmentMap.get(sale.sales_id) ?? null;

      return {
        sales_id: sale.sales_id,
        organization_id: sale.organization_id,
        customer_id: sale.customer_id,
        sales_invoice_no: sale.sales_invoice_no || "N/A",
        invoice_date: sale.sales_date || null,
        total_amount: sale.sales_amount || 0,
        taxable_amount: sale.taxable_amount || 0,
        vat_amount: sale.gst_amount || 0,
        sales_amount: sale.sales_amount || 0,
        exempt_amount: sale.exempt_amount || 0,
        gst_amount: sale.gst_amount || 0,
        status: sale.status,
        sales_date: sale.sales_date,
        created_at: sale.createdAt,
        customer_name: customerDisplayName || "",
        customer_tpn: sale.customer_tpn || "",
        currency_code: sale.currency_info?.currency_code || "BTN",
        items_count: sale.items?.length || 0,

        
        is_adjustment: adjustmentId !== null,
        adjustment_id: adjustmentId,
      };
    });

    return Response.json({
      success: true,
      data: formattedSales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message:
        total > 0
          ? `Found ${total} sale(s) for this customer`
          : "No sales found for this customer",
    });
  } catch (error) {
    console.error("Error searching sales:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
