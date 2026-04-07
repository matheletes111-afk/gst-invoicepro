import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";


// GET - List second hand purchases with pagination, search, and filters
// GET - List second hand purchases with pagination, search, and filters
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
    const total = await prisma.secondHandPurchase.count({ where });

    // Get second hand purchases with relations (REMOVED stockItems)
    const purchases = await prisma.secondHandPurchase.findMany({
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
                goodsName: true,
                goodsCode: true
              }
            },
            service: {
              select: {
                service_id: true,
                service_name: true,
                service_code: true
              }
            },
            unitObject: true
            // REMOVED: stockItems inclusion
          }
        }
        // REMOVED: stockItems inclusion
      }
    });

    // Transform data to include supplier_name and dealer_name for frontend
    const transformedPurchases = purchases.map(purchase => ({
      ...purchase,
      supplier_name: purchase.supplier?.supplierName || null,
      dealer_name: purchase.dealer?.dealerName || null,
      supplier_tpn: purchase.supplier?.taxpayerRegNo || null,
      dealer_tpn: purchase.dealer?.taxpayerRegNo || null,
      // REMOVED: total_stock_items
      total_items: purchase.items?.length || 0 // Added total_items instead
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
    console.error("Error fetching second hand purchases:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete second hand purchase
export async function DELETE(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const existingPurchase = await prisma.secondHandPurchase.findUnique({
      where: { purchase_id: parseInt(purchase_id) },
      include: {
        items: true // Include items to get their details
      }
    });

    if (!existingPurchase) {
      return Response.json({
        success: false,
        error: "Second hand purchase not found"
      }, { status: 404 });
    }

    // Verify that the purchase belongs to user's organization
    if (existingPurchase.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this purchase record"
      }, { status: 403 });
    }

    // Process deletion with inventory reversal in a transaction
    const result = await prisma.$transaction(async (tx) => {
      try {
        // First, check inventory for all items before deleting
        for (const item of existingPurchase.items) {
          if (item.quantity > 0) {
            const existingInventory = await tx.inventoryMaster.findFirst({
              where: {
                organization_id: organizationId,
                unit_id: item.unit_of_measurement_id,
                price: item.unit_price,
                OR: [
                  { goods_id: item.goods_id },
                  { service_id: item.service_id }
                ]
              }
            });

            if (existingInventory) {
              const existingQty = typeof existingInventory.qty === 'string'
                ? parseInt(existingInventory.qty)
                : Math.round(existingInventory.qty);

              // Check if we have enough inventory to reverse this purchase
              if (existingQty < item.quantity) {
                const itemName = item.goods_service_name || 'item';
                throw new Error(`Cannot delete purchase. Insufficient inventory for ${itemName}. Current stock: ${existingQty}, need to remove: ${item.quantity}`);
              }
            } else {
              // If inventory doesn't exist but we have items to remove
              const itemName = item.goods_service_name || 'item';
              throw new Error(`Cannot delete purchase. Inventory not found for ${itemName}.`);
            }
          }
        }

        // Now reverse inventory for all items (subtract quantities)
        for (const item of existingPurchase.items) {
          if (item.quantity > 0) {
            const itemForInventory = {
              purchase_item_type: item.goods_id ? 'GOODS' : 'SERVICE',
              goods_id: item.goods_id,
              service_id: item.service_id,
              goods_service_name: item.goods_service_name,
              unit_of_measurement_id: item.unit_of_measurement_id,
              unit_price: item.unit_price,
              quantity: -item.quantity, // Negative to subtract from inventory
              gst_rate: parseFloat(item.gst_percentage || 0)
            };

            // Update inventory with negative quantity
            await updateInventory(tx, itemForInventory, organizationId, existingPurchase.created_by, true, 0, req);
          }
        }

        // Delete purchase items first due to foreign key constraint
        await tx.secondHandPurchaseItem.deleteMany({
          where: { purchase_id: parseInt(purchase_id) }
        });

        // Then delete the purchase
        await tx.secondHandPurchase.delete({
          where: { purchase_id: parseInt(purchase_id) }
        });

        return { success: true };
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    });

    return Response.json({
      success: true,
      message: "Second hand purchase deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting second hand purchase:", error);

    // Check if error is about inventory
    let statusCode = 500;
    if (error.message.includes("Cannot delete purchase") ||
      error.message.includes("Insufficient inventory") ||
      error.message.includes("Inventory not found")) {
      statusCode = 400;
    }

    return Response.json({
      success: false,
      error: error.message || "An error occurred while deleting the purchase"
    }, { status: statusCode });
  }
}

// Function to update inventory with validation (same as in update)
const updateInventory = async (tx, item, organizationId, created_by, isUpdate = false, oldQuantity = 0, req) => {
  const itemType = item.purchase_item_type; // 'GOODS' or 'SERVICE'
  const itemId = itemType === 'GOODS' ? parseInt(item.goods_id) : parseInt(item.service_id);
  const unitId = parseInt(item.unit_of_measurement_id);
  const price = parseFloat(item.unit_price);
  const quantity = parseInt(item.quantity); // This can be negative for deletion

  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if inventory already exists for this item
  const existingInventory = await tx.inventoryMaster.findFirst({
    where: {
      organization_id: organizationId,
      unit_id: unitId,
      price: price,
      OR: [
        { goods_id: itemType === 'GOODS' ? itemId : null },
        { service_id: itemType === 'SERVICE' ? itemId : null }
      ]
    }
  });

  if (existingInventory) {
    // Parse existing qty as integer
    const existingQty = typeof existingInventory.qty === 'string'
      ? parseInt(existingInventory.qty)
      : Math.round(existingInventory.qty);

    let newQty;

    if (isUpdate) {
      // For update operation: calculate the difference
      const quantityDiff = quantity - oldQuantity;
      newQty = existingQty + quantityDiff;
    } else {
      // For create/delete operation: add/subtract quantity
      newQty = existingQty + quantity;
    }

    // Check if new quantity would go negative
    if (newQty < 0) {
      throw new Error(`Insufficient inventory for ${item.goods_service_name || 'item'}. Current stock: ${existingQty}, attempted to reduce by ${Math.abs(quantity)}`);
    }

    const newInventoryAmount = newQty * price;

    return await tx.inventoryMaster.update({
      where: { id: existingInventory.id },
      data: {
        qty: newQty,
        inventory_amount: newInventoryAmount,
        updated_at: new Date(),
      }
    });
  } else {
    // For delete operation, if inventory doesn't exist but we're trying to reduce stock
    if (quantity < 0) {
      throw new Error(`Inventory not found for ${item.goods_service_name || 'item'}. Cannot reduce stock.`);
    }

    // Create new inventory entry (for positive quantities)
    const inventoryAmount = quantity * price;

    const inventoryData = {
      unit_id: unitId,
      price: price,
      qty: quantity,
      inventory_amount: inventoryAmount,
      organization_id: organizationId,
      // created_by: created_by,
      created_by: user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Set goods_id or service_id based on type
    if (itemType === 'GOODS') {
      inventoryData.goods_id = itemId;
    } else {
      inventoryData.service_id = itemId;
    }

    return await tx.inventoryMaster.create({
      data: inventoryData
    });
  }
};