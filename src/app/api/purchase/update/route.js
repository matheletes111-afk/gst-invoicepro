import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helper function to calculate all values for an item
const calculateItemValues = (item) => {
  const unitPrice = parseFloat(item.unit_price);
  const quantity = parseFloat(item.quantity);
  // Use gst_percentage from payload (not gst_rate)
  const gstRate = parseFloat(item.gst_percentage || 0) / 100; // Convert percentage to decimal

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
  const gst_amount = 0;
  const goods_service_total_amount = amount_after_discount;

  return {
    amount,
    discountAmount,
    amount_after_discount,
    gst_amount,
    goods_service_total_amount,
    gstRate: gstRate * 100 // Return as percentage for storage
  };
};

export async function POST(req) {
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
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
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
    const {
      purchase_id,
      supplier_id,
      dealer_id,
      currency,
      purchase_date,
      purchase_order_no,
      items,
      // Payment fields
      payment_mode,
      transaction_id,
      journal_number,
      cheque_number,
      bank_name,
      // Remove created_by from request body, use from auth
    } = body;

    if (!purchase_id) {
      return Response.json({
        success: false,
        error: "Purchase ID is required"
      }, { status: 400 });
    }

    // Check if purchase exists and belongs to user's organization
    const existingPurchase = await prisma.purchase.findUnique({
      where: { purchase_id: parseInt(purchase_id) }
    });

    if (!existingPurchase) {
      return Response.json({
        success: false,
        error: "Purchase not found"
      }, { status: 404 });
    }

    // Verify that the purchase belongs to user's organization
    if (existingPurchase.organization_id !== parseInt(organizationId)) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this purchase record"
      }, { status: 403 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({
        success: false,
        error: "At least one item is required"
      }, { status: 400 });
    }

    // Calculate totals for purchase
    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;
    let gst_amount = 0;

    const calculatedItems = items.map(item => {
      // Validate required fields
      if (!item.unit_price || !item.quantity) {
        throw new Error(`Unit price and quantity are required`);
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);
      const gstPercentage = parseFloat(item.gst_percentage || 0);

      if (isNaN(unitPrice) || isNaN(quantity) || unitPrice <= 0 || quantity <= 0) {
        throw new Error(`Invalid unit price or quantity`);
      }

      // Calculate all item values
      const itemValues = calculateItemValues({
        ...item,
        gst_percentage: gstPercentage
      });

      // Update purchase totals
      sales_amount += itemValues.amount_after_discount;
      gst_amount += itemValues.gst_amount;

      // Check if exempt (GST percentage = 0)
      if (gstPercentage === 0) {
        exempt_amount += itemValues.amount_after_discount;
      } else {
        taxable_amount += itemValues.amount_after_discount;
      }

      // Prepare item data
      const itemData = {
        purchase_item_type: item.purchase_item_type,
        goods_service_name: item.goods_service_name || null,
        goods_service_description: item.goods_service_description || null,
        unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
        unit_price: unitPrice,
        quantity: quantity,
        amount: itemValues.amount,
        discount: itemValues.discountAmount,
        amount_after_discount: itemValues.amount_after_discount,
        gst_amount: itemValues.gst_amount,
        gst_percentage: String(item.gst_percentage ?? "0"), // Store as string
        goods_service_total_amount: itemValues.goods_service_total_amount,
        created_by: user.id,
        created_on: new Date(),
      };

      // Set goods_id or service_id based on type
      if (item.purchase_item_type === 'GOODS') {
        if (item.goods_id) {
          itemData.goods_id = parseInt(item.goods_id);
        }
        // Explicitly set service_id to null for goods
        itemData.service_id = null;
      } else if (item.purchase_item_type === 'SERVICE') {
        if (item.service_id) {
          itemData.service_id = parseInt(item.service_id);
        }
        // Explicitly set goods_id to null for services
        itemData.goods_id = null;
      }

      return itemData;
    });

    // Calculate total invoice amount
    const total_invoice_amount = sales_amount + gst_amount;

    // Update purchase with items in transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Delete existing purchase items
      await tx.purchaseItem.deleteMany({
        where: { purchase_id: parseInt(purchase_id) }
      });

      // Prepare purchase update data
      const purchaseUpdateData = {
        supplier_id: parseInt(supplier_id),
        currency: parseInt(currency),
        purchase_date: new Date(purchase_date),
        purchase_order_no: purchase_order_no || existingPurchase.purchase_order_no,
        sales_amount,
        exempt_amount,
        taxable_amount,
        gst_amount,
        total_invoice_amount,
        // Payment fields
        payment_mode: payment_mode || existingPurchase.payment_mode,
        transaction_id: transaction_id || existingPurchase.transaction_id,
        journal_number: journal_number || existingPurchase.journal_number,
        cheque_number: cheque_number || existingPurchase.cheque_number,
        bank_name: bank_name || existingPurchase.bank_name,
      };

      // Handle dealer_id - set to null if not provided
      if (dealer_id) {
        purchaseUpdateData.dealer_id = parseInt(dealer_id);
      } else {
        purchaseUpdateData.dealer_id = null;
      }

      // Update purchase record
      const purchase = await tx.purchase.update({
        where: { purchase_id: parseInt(purchase_id) },
        data: purchaseUpdateData
      });

      // Create new purchase items
      await tx.purchaseItem.createMany({
        data: calculatedItems.map(item => ({
          ...item,
          purchase_id: parseInt(purchase_id)
        }))
      });

      // Fetch the updated purchase with items
      const purchaseWithItems = await tx.purchase.findUnique({
        where: { purchase_id: parseInt(purchase_id) },
        include: {
          items: {
            include: {
              goods: true,
              service: true,
              unitObject: true
            }
          },
          supplier: true,
          dealer: true,
          currency_info: true
        }
      });

      return purchaseWithItems;
    });

    return Response.json({
      success: true,
      message: "Purchase updated successfully",
      data: {
        purchase_id: updatedPurchase.purchase_id,
        purchase_order_no: updatedPurchase.purchase_order_no,
        total_invoice_amount: updatedPurchase.total_invoice_amount,
        purchase_date: updatedPurchase.purchase_date,
        supplier_id: updatedPurchase.supplier_id,
        dealer_id: updatedPurchase.dealer_id,
        sales_amount: updatedPurchase.sales_amount,
        exempt_amount: updatedPurchase.exempt_amount,
        taxable_amount: updatedPurchase.taxable_amount,
        gst_amount: updatedPurchase.gst_amount
      }
    });

  } catch (error) {
    console.error("Error updating purchase:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}