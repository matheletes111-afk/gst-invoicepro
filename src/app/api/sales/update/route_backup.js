import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// Helper function to calculate all values for an item
const calculateItemValues = (item) => {
  const unitPrice = parseFloat(item.unit_price);
  const quantity = parseFloat(item.quantity);
  const gstRate = parseFloat(item.gst_rate || 0);

  const amount = unitPrice * quantity;

  let discountAmount = 0;
  if (item.discount && item.discount !== '') {
    const discountStr = item.discount.toString().trim();
    if (discountStr.endsWith('%')) {
      const percentage = parseFloat(discountStr.replace('%', ''));
      if (!isNaN(percentage)) {
        discountAmount = (amount * percentage) / 100;
      }
    } else {
      const discountValue = parseFloat(discountStr);
      discountAmount = isNaN(discountValue) ? 0 : discountValue;
    }
  }

  const amount_after_discount = amount - discountAmount;
  const gst_amount = (amount_after_discount * gstRate) / 100;
  const goods_service_total_amount = amount_after_discount + gst_amount;

  return {
    amount,
    discountAmount,
    amount_after_discount,
    gst_amount,
    goods_service_total_amount,
    gstRate
  };
};

export async function POST(req) {
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
    const {
      sales_id,
      customer_id,
      currency,
      customer_tpn,
      customer_name,
      sales_date,
      items,
      created_by,
      status
    } = body;

    if (!sales_id) {
      return Response.json({
        success: false,
        error: "Sales ID is required"
      }, { status: 400 });
    }

    // Check if sale exists and belongs to user's organization
    const existingSale = await prisma.sales.findUnique({
      where: { sales_id: parseInt(sales_id) }
    });

    if (!existingSale) {
      return Response.json({
        success: false,
        error: "Sales not found"
      }, { status: 404 });
    }

    // Verify that the sales belongs to user's organization
    if (existingSale.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this sales record"
      }, { status: 403 });
    }

    // Validate items exist
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return Response.json({
        success: false,
        error: "Organization not found"
      }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({
        success: false,
        error: "At least one item is required"
      }, { status: 400 });
    }

    // Calculate totals for sales
    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;

    const calculatedItems = items.map(item => {
      // Validate required fields
      if (!item.unit_price || !item.quantity) {
        throw new Error(`Unit price and quantity are required`);
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);
      const gstRate = parseFloat(item.gst_rate || 0);

      if (isNaN(unitPrice) || isNaN(quantity) || unitPrice <= 0 || quantity <= 0) {
        throw new Error(`Invalid unit price or quantity`);
      }

      // Calculate all item values
      const itemValues = calculateItemValues(item);

      // Update sales totals
      // sales_amount += itemValues.goods_service_total_amount;
      sales_amount += itemValues.amount_after_discount;

      // Check if exempt (GST rate = 0)
      if (gstRate === 0) {
        // exempt_amount += itemValues.goods_service_total_amount;
        exempt_amount += itemValues.amount_after_discount;
      } else {
        // taxable_amount += itemValues.goods_service_total_amount;
        taxable_amount += itemValues.amount_after_discount;
      }

      // Prepare item data
      const itemData = {
        sales_item_type: item.sales_item_type,
        goods_service_name: item.goods_service_name || null,
        goods_service_description: item.goods_service_description || null,
        unit_price: unitPrice,
        quantity: quantity,
        amount: itemValues.amount,
        discount: itemValues.discountAmount,
        amount_after_discount: itemValues.amount_after_discount,
        gst_amount: itemValues.gst_amount,
        gst_percentage: String(item.gst_rate ?? ""),
        goods_service_total_amount: itemValues.goods_service_total_amount,
        created_by: parseInt(created_by),
        created_on: new Date(),
        // Connect relations
        unitObject: {
          connect: { id: parseInt(item.unit_of_measurement_id) }
        }
      };

      // Connect goods or service based on type
      if (item.sales_item_type === 'GOODS') {
        itemData.goods = {
          connect: { goodsId: parseInt(item.goods_services_id) }
        };
        itemData.service = undefined; // Don't set service relation for goods
      } else {
        itemData.service = {
          connect: { service_id: parseInt(item.goods_services_id) }
        };
        itemData.goods = undefined; // Don't set goods relation for service
      }

      return itemData;
    });

    // Update sales with items in transaction
    const updatedSales = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.salesItem.deleteMany({
        where: { sales_id: parseInt(sales_id) }
      });

      // Update sales record
      const sale = await tx.sales.update({
        where: { sales_id: parseInt(sales_id) },
        data: {
          // Use relation fields - organization cannot be changed
          // organization: {
          //   connect: { id: organizationId }
          // },
          customer: {
            connect: { partyId: parseInt(customer_id) }
          },
          currency_info: {
            connect: { currencyId: parseInt(currency) }
          },
          customer_tpn: customer_tpn || null,
          customer_name: customer_name || null,
          sales_date: new Date(sales_date),
          sales_amount,
          exempt_amount,
          taxable_amount,
          gst_amount: taxable_amount > 0 ? taxable_amount * 0.05 : 0,
          total_invoice_amount: exempt_amount + taxable_amount + (taxable_amount > 0 ? taxable_amount * 0.05 : 0),
          status: status || existingSale.status,
          items: {
            create: calculatedItems
          }
        },
        // Include items for response
        include: {
          items: true
        }
      });

      return sale;
    });

    return Response.json({
      success: true,
      message: "Sales updated successfully",
      data: {
        sales_id: updatedSales.sales_id,
        sales_invoice_no: updatedSales.sales_invoice_no,
        sales_amount: updatedSales.sales_amount,
        sales_date: updatedSales.sales_date,
        status: updatedSales.status
      }
    });

  } catch (error) {
    console.error("Error updating sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}