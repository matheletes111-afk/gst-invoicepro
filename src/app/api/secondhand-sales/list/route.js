import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// GET - List second hand sales with pagination, search, and filters
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
    const sortBy = searchParams.get("sortBy") || "second_hand_sales_id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Search and Filters
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build where clause - always filter by organizationId from JWT
    let where = {
      organization_id: organizationId
    };

    // Add status filter if provided, otherwise exclude deleted
    if (statusFilter) {
      where.status = statusFilter;
    } else {
      where.status = { not: "D" };
    }

    const conditions = [];

    // Search in multiple fields
    if (search) {
      conditions.push(
        { sales_invoice_no: { contains: search } },
        { customer_tpn: { contains: search } },
        { customer_name: { contains: search } }
      );

      // Numeric search
      const numericValue = Number(search);
      if (!isNaN(numericValue)) {
        const min = numericValue;
        const max = numericValue + 0.999999;

        conditions.push(
          { second_hand_sales_id: { gte: min, lte: max } },
          { sales_amount: { gte: min, lte: max } },
          { exempt_amount: { gte: min, lte: max } },
          { taxable_amount: { gte: min, lte: max } },
          { gst_amount: { gte: min, lte: max } }
        );
      }
    }

    // Apply customer filter
    if (customerId) {
      where.customer_id = parseInt(customerId);
    }

    // Date range filter
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
        { organization_id: organizationId },
        { OR: conditions }
      ];

      // Add status condition back if not filtered
      if (!statusFilter) {
        where.AND.push({ status: { not: "D" } });
      }
    }

    // Get total count
    const total = await prisma.secondHandSale.count({ where });

    // Get second hand sales with relations
    const sales = await prisma.secondHandSale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        customer: {
          include: {
            individualParty: true,
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true
          }
        },
        currency_info: true,
        items: {
          include: {
            goods: true,
            service: true,
            unit: true
          }
        }
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
    console.error("Error fetching second hand sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}












// Helper function to restore inventory when sales is deleted
const restoreInventory = async (tx, items, organizationId, req) => {
  for (const item of items) {
    const itemType = item.sales_item_type; // 'GOODS' or 'SERVICE'
    const itemId = itemType === 'GOODS' ? item.goods_id : item.service_id;
    const unitId = item.unit_of_measurement_id;
    const purchaseAmount = parseFloat(item.purchase_amount); // Use purchase_amount, not unit_price
    const quantity = parseFloat(item.quantity); // Quantity to restore

    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if inventory exists - SEARCH USING PURCHASE AMOUNT
    const existingInventory = await tx.inventoryMaster.findFirst({
      where: {
        organization_id: organizationId,
        unit_id: unitId,
        price: purchaseAmount, // Use purchase_amount
        OR: [
          { goods_id: itemType === 'GOODS' ? itemId : null },
          { service_id: itemType === 'SERVICE' ? itemId : null }
        ]
      }
    });

    if (existingInventory) {
      // Parse existing qty as decimal
      const existingQty = parseFloat(existingInventory.qty);

      // RESTORE inventory by adding back the quantity
      const newQty = existingQty + quantity;
      const newInventoryAmount = newQty * purchaseAmount; // Use purchase_amount for calculation

      await tx.inventoryMaster.update({
        where: { id: existingInventory.id },
        data: {
          qty: newQty,
          inventory_amount: newInventoryAmount,
          updated_at: new Date(),
        }
      });
    } else {
      // If inventory doesn't exist, create new entry with restored quantity
      const inventoryData = {
        unit_id: unitId,
        price: purchaseAmount, // Use purchase_amount
        qty: quantity,
        inventory_amount: quantity * purchaseAmount, // Use purchase_amount
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date(),
        // created_by: 1,
        created_by: user.id,
        updated_by: user.id,
      };

      // Set goods_id or service_id based on type
      if (itemType === 'GOODS') {
        inventoryData.goods_id = itemId;
      } else {
        inventoryData.service_id = itemId;
      }

      await tx.inventoryMaster.create({
        data: inventoryData
      });
    }
  }
};

// DELETE - Soft delete second hand sales and restore inventory
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
    const { second_hand_sales_id } = body;

    if (!second_hand_sales_id) {
      return Response.json({
        success: false,
        error: "Second Hand Sales ID is required"
      }, { status: 400 });
    }

    const salesId = parseInt(second_hand_sales_id);

    // Check if sales exists and get items
    const existingSales = await prisma.secondHandSale.findUnique({
      where: { second_hand_sales_id: salesId },
      include: {
        items: true
      }
    });

    if (!existingSales || existingSales.status === "D") {
      return Response.json({
        success: false,
        error: "Second hand sales not found"
      }, { status: 404 });
    }

    // Verify that the sales belongs to user's organization
    if (existingSales.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this sales record"
      }, { status: 403 });
    }

    // Soft delete the sales and restore inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. First, restore inventory for all items
      await restoreInventory(tx, existingSales.items, organizationId, req);

      // 2. Then soft delete the sales record
      const deletedSales = await tx.secondHandSale.update({
        where: { second_hand_sales_id: salesId },
        data: {
          status: "D"
        },
        include: {
          items: {
            include: {
              goods: true,
              service: true,
              unit: true
            }
          }
        }
      });

      return deletedSales;
    });

    return Response.json({
      success: true,
      message: "Second hand sales deleted successfully and inventory restored",
      data: result
    });

  } catch (error) {
    console.error("Error deleting second hand sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}