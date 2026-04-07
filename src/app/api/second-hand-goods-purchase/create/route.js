import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      supplierId,
      dealerId,
      date,
      purchaseOrderNo,
      purchaseOrderDate,
      currencyId,
      totalPrice,
      items,
      status 
    } = body;

    // Validate required fields
    if (!date) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Date is required." 
      }), { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "At least one item is required."
      }), { status: 400 });
    }

    // Validate items
    for (const item of items) {
      if (!item.goodsName) {
        return new Response(JSON.stringify({
          success: false,
          error: "Goods Name is required for all items."
        }), { status: 400 });
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Unit Price must be greater than 0 for all items."
        }), { status: 400 });
      }
      if (!item.quantity || item.quantity <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Quantity must be greater than 0 for all items."
        }), { status: 400 });
      }
    }

    // Verify relations if provided
    if (supplierId) {
      const supplier = await prisma.supplierMaster.findUnique({
        where: { supplierId: parseInt(supplierId) }
      });
      if (!supplier) {
        return new Response(JSON.stringify({
          success: false,
          error: "Supplier not found."
        }), { status: 404 });
      }
    }

    if (dealerId) {
      const dealer = await prisma.dealerMaster.findUnique({
        where: { dealerId: parseInt(dealerId) }
      });
      if (!dealer) {
        return new Response(JSON.stringify({
          success: false,
          error: "Dealer not found."
        }), { status: 404 });
      }
    }

    if (currencyId) {
      const currency = await prisma.Currency.findUnique({
        where: { currencyId: parseInt(currencyId) }
      });
      if (!currency) {
        return new Response(JSON.stringify({
          success: false,
          error: "Currency not found."
        }), { status: 404 });
      }
    }

    // Verify unit IDs if provided
    for (const item of items) {
      if (item.unitId) {
        const unit = await prisma.Unit.findUnique({
          where: { id: parseInt(item.unitId) }
        });
        if (!unit) {
          return new Response(JSON.stringify({
            success: false,
            error: `Unit not found for item: ${item.goodsName}.`
          }), { status: 404 });
        }
      }
    }

    // Calculate total price from items if not provided
    let calculatedTotal = 0;
    const processedItems = items.map(item => {
      const amount = (item.unitPrice || 0) * (item.quantity || 0);
      calculatedTotal += amount;
      return {
        goodsName: item.goodsName,
        goodsDescription: item.goodsDescription || null,
        unitId: item.unitId ? parseInt(item.unitId) : null,
        unitPrice: parseFloat(item.unitPrice),
        quantity: parseFloat(item.quantity),
        amount: amount,
        status: item.status || "A"
      };
    });

    // Use provided totalPrice or calculated total
    const finalTotalPrice = totalPrice || calculatedTotal;

    // Create purchase order with items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.secondHandGoodsPurchase.create({
        data: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          dealerId: dealerId ? parseInt(dealerId) : null,
          date: new Date(date),
          purchaseOrderNo: purchaseOrderNo || null,
          purchaseOrderDate: purchaseOrderDate ? new Date(purchaseOrderDate) : null,
          currencyId: currencyId ? parseInt(currencyId) : null,
          totalPrice: finalTotalPrice,
          status: status || "A"
        }
      });

      // Create items
      await tx.secondHandGoodsPurchaseItem.createMany({
        data: processedItems.map(item => ({
          ...item,
          purchaseOrderId: po.purchaseOrderId
        }))
      });

      // Return purchase order with items
      return await tx.secondHandGoodsPurchase.findUnique({
        where: { purchaseOrderId: po.purchaseOrderId },
        include: {
          supplier: {
            select: {
              supplierId: true,
              supplierName: true
            }
          },
          dealer: {
            select: {
              dealerId: true,
              dealerName: true
            }
          },
          currency: {
            select: {
              currencyId: true,
              currencyName: true,
              currencySymbol: true
            }
          },
          items: {
            include: {
              unit: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Purchase Order created successfully",
      purchaseOrder
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

