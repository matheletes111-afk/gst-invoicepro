import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
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

    // Verify currency if provided
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

    // Create sales order with items in a transaction
    const salesOrder = await prisma.$transaction(async (tx) => {
      const so = await tx.secondHandGoodsSales.create({
        data: {
          customer: customer || null,
          customerTPN: customerTPN || null,
          date: new Date(date),
          invoiceNo: invoiceNo || null,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          currencyId: currencyId ? parseInt(currencyId) : null,
          totalPrice: finalTotalPrice,
          status: status || "A"
        }
      });

      // Create items
      await tx.secondHandGoodsSalesItem.createMany({
        data: processedItems.map(item => ({
          ...item,
          salesOrderId: so.salesOrderId
        }))
      });

      // Return sales order with items
      return await tx.secondHandGoodsSales.findUnique({
        where: { salesOrderId: so.salesOrderId },
        include: {
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
      message: "Sales Order created successfully",
      salesOrder
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

