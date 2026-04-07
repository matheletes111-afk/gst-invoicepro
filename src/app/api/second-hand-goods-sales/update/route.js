import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      id,
      customer,
      customerTPN,
      date,
      invoiceNo,
      invoiceDate,
      currencyId,
      totalPrice,
      items,
      status 
    } = body;

    if (!id) {
      return Response.json({ error: "Sales Order ID is required" }, { status: 400 });
    }

    // Verify sales order exists
    const existingSO = await prisma.secondHandGoodsSales.findUnique({
      where: { salesOrderId: Number(id) }
    });

    if (!existingSO) {
      return Response.json({ error: "Sales Order not found" }, { status: 404 });
    }

    // Verify currency if provided
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

    // Update sales order and items in a transaction
    const salesOrder = await prisma.$transaction(async (tx) => {
      // Update sales order header
      const updateData = {};
      if (customer !== undefined) updateData.customer = customer || null;
      if (customerTPN !== undefined) updateData.customerTPN = customerTPN || null;
      if (date) updateData.date = new Date(date);
      if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo || null;
      if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate ? new Date(invoiceDate) : null;
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

      const updatedSO = await tx.secondHandGoodsSales.update({
        where: { salesOrderId: Number(id) },
        data: updateData
      });

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Soft delete all existing items
        await tx.secondHandGoodsSalesItem.updateMany({
          where: { salesOrderId: Number(id) },
          data: { status: "D" }
        });

        // Create new items
        const newItems = items
          .filter(item => item.goodsName) // Only items with goodsName
          .map(item => ({
            salesOrderId: Number(id),
            goodsName: item.goodsName,
            goodsDescription: item.goodsDescription || null,
            unitId: item.unitId ? parseInt(item.unitId) : null,
            unitPrice: parseFloat(item.unitPrice),
            quantity: parseFloat(item.quantity),
            amount: parseFloat(item.unitPrice) * parseFloat(item.quantity),
            status: item.status || "A"
          }));

        if (newItems.length > 0) {
          await tx.secondHandGoodsSalesItem.createMany({
            data: newItems
          });
        }
      }

      // Return updated sales order with items
      return await tx.secondHandGoodsSales.findUnique({
        where: { salesOrderId: Number(id) },
        include: {
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

    return Response.json({ success: true, salesOrder });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

