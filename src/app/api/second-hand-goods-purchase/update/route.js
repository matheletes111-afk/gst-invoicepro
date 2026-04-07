import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      id,
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

    if (!id) {
      return Response.json({ error: "Purchase Order ID is required" }, { status: 400 });
    }

    // Verify purchase order exists
    const existingPO = await prisma.secondHandGoodsPurchase.findUnique({
      where: { purchaseOrderId: Number(id) }
    });

    if (!existingPO) {
      return Response.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    // Verify relations if provided
    if (supplierId) {
      const supplier = await prisma.supplierMaster.findUnique({
        where: { supplierId: parseInt(supplierId) }
      });
      if (!supplier) {
        return Response.json({
          error: "Supplier not found."
        }, { status: 404 });
      }
    }

    if (dealerId) {
      const dealer = await prisma.dealerMaster.findUnique({
        where: { dealerId: parseInt(dealerId) }
      });
      if (!dealer) {
        return Response.json({
          error: "Dealer not found."
        }, { status: 404 });
      }
    }

    if (currencyId) {
      const currency = await prisma.Currency.findUnique({
        where: { currencyId: parseInt(currencyId) }
      });
      if (!currency) {
        return Response.json({
          error: "Currency not found."
        }, { status: 404 });
      }
    }

    // If items are provided, validate them
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.goodsName && (!item.unitPrice || item.unitPrice <= 0)) {
          return Response.json({
            error: "Unit Price must be greater than 0 for all items."
          }, { status: 400 });
        }
        if (item.goodsName && (!item.quantity || item.quantity <= 0)) {
          return Response.json({
            error: "Quantity must be greater than 0 for all items."
          }, { status: 400 });
        }
        if (item.unitId) {
          const unit = await prisma.Unit.findUnique({
            where: { id: parseInt(item.unitId) }
          });
          if (!unit) {
            return Response.json({
              error: `Unit not found for item: ${item.goodsName || 'unknown'}.`
            }, { status: 404 });
          }
        }
      }
    }

    // Update purchase order and items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Update purchase order header
      const updateData = {};
      if (supplierId !== undefined) updateData.supplierId = supplierId ? parseInt(supplierId) : null;
      if (dealerId !== undefined) updateData.dealerId = dealerId ? parseInt(dealerId) : null;
      if (date) updateData.date = new Date(date);
      if (purchaseOrderNo !== undefined) updateData.purchaseOrderNo = purchaseOrderNo || null;
      if (purchaseOrderDate !== undefined) updateData.purchaseOrderDate = purchaseOrderDate ? new Date(purchaseOrderDate) : null;
      if (currencyId !== undefined) updateData.currencyId = currencyId ? parseInt(currencyId) : null;
      if (status) updateData.status = status;

      // Calculate total from items if items are provided
      if (items && Array.isArray(items)) {
        const calculatedTotal = items.reduce((sum, item) => {
          if (item.unitPrice && item.quantity) {
            return sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity));
          }
          return sum;
        }, 0);
        updateData.totalPrice = totalPrice || calculatedTotal;
      } else if (totalPrice !== undefined) {
        updateData.totalPrice = totalPrice;
      }

      const updatedPO = await tx.secondHandGoodsPurchase.update({
        where: { purchaseOrderId: Number(id) },
        data: updateData
      });

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Soft delete all existing items
        await tx.secondHandGoodsPurchaseItem.updateMany({
          where: { purchaseOrderId: Number(id) },
          data: { status: "D" }
        });

        // Create new items
        const newItems = items
          .filter(item => item.goodsName) // Only items with goodsName
          .map(item => ({
            purchaseOrderId: Number(id),
            goodsName: item.goodsName,
            goodsDescription: item.goodsDescription || null,
            unitId: item.unitId ? parseInt(item.unitId) : null,
            unitPrice: parseFloat(item.unitPrice),
            quantity: parseFloat(item.quantity),
            amount: parseFloat(item.unitPrice) * parseFloat(item.quantity),
            status: item.status || "A"
          }));

        if (newItems.length > 0) {
          await tx.secondHandGoodsPurchaseItem.createMany({
            data: newItems
          });
        }
      }

      // Return updated purchase order with items
      return await tx.secondHandGoodsPurchase.findUnique({
        where: { purchaseOrderId: Number(id) },
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
            where: { status: { not: "D" } },
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

    return Response.json({ success: true, purchaseOrder });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

