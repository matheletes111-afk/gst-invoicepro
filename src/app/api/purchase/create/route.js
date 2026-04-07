import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";


/**
 * Helper function to generate auto numeric alphanumeric purchase order number with date
 */
const generatePurchaseOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `PO-${year}${month}${day}-${randomNum}`;
};

/**
 * Helper function to calculate all values for an item
 */
const calculateItemValues = (item) => {
  const unitPrice = parseFloat(item.unit_price);
  const quantity = parseFloat(item.quantity);
  const gstRate = parseFloat(item.gst_percentage || 0);

  const amount = unitPrice * quantity;

  let discountAmount = 0;
  if (item.discount && item.discount !== "") {
    const discountStr = item.discount.toString().trim();
    if (discountStr.endsWith("%")) {
      const percentage = parseFloat(discountStr.replace("%", ""));
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
  };
};

export async function POST(req) {
  try {
    // 🔐 Get organizationId from JWT
    const organizationId = await getOrganizationIdFromRequest(req);
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!organizationId) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
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
            action: 'CREATE',  //CREATE, UPDATE, DELETE
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
      supplier_id,
      dealer_id,
      currency,
      purchase_date,
      purchase_order_no,
      created_by,
      items,
      // Payment fields
      payment_mode,
      transaction_id,
      cheque_number,
      journal_number,
      bank_name
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;

    const calculatedItems = items.map((item) => {
      if (!item.unit_price || !item.quantity) {
        throw new Error("Unit price and quantity are required");
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);
      const gstRate = parseFloat(item.gst_percentage || 0);

      if (unitPrice <= 0 || quantity <= 0) {
        throw new Error("Invalid unit price or quantity");
      }

      const values = calculateItemValues(item);

      sales_amount += values.amount_after_discount;

      if (gstRate === 0) {
        exempt_amount += values.amount_after_discount;
      } else {
        taxable_amount += values.amount_after_discount;
      }

      const itemData = {
        purchase_item_type: item.purchase_item_type, // GOODS | SERVICE
        goods_service_name: item.goods_service_name || null,
        goods_service_description: item.goods_service_description || null,
        unit_price: unitPrice,
        quantity: quantity,
        amount: values.amount,
        discount: values.discountAmount,
        amount_after_discount: values.amount_after_discount,
        gst_amount: values.gst_amount,
        gst_percentage: item.gst_percentage?.toString() || "0",
        goods_service_total_amount: values.goods_service_total_amount,
        // created_by: parseInt(created_by),
        created_by: user.id,
        created_on: new Date(),
        unitObject: {
          connect: { id: parseInt(item.unit_of_measurement_id) },
        },
      };

      // ✅ GOODS
      if (
        item.purchase_item_type === "GOODS" &&
        item.goods_id
      ) {
        itemData.goods = {
          connect: { goodsId: parseInt(item.goods_id) },
        };
      }

      // ✅ SERVICE
      if (
        item.purchase_item_type === "SERVICE" &&
        item.service_id
      ) {
        itemData.service = {
          connect: { service_id: parseInt(item.service_id) },
        };
      }

      return itemData;
    });

    // const gst_amount = taxable_amount * 0.05;
    const gst_amount = 0;
    // const total_invoice_amount = sales_amount + gst_amount;
    const total_invoice_amount = sales_amount;

    const purchase = await prisma.$transaction(async (tx) => {
      return await tx.purchase.create({
        data: {
          organization: {
            connect: { id: parseInt(organizationId) },
          },
          supplier: {
            connect: { supplierId: parseInt(supplier_id) },
          },
          dealer: dealer_id
            ? { connect: { dealerId: parseInt(dealer_id) } }
            : undefined,
          currency_info: {
            connect: { currencyId: parseInt(currency) },
          },
          purchase_date: new Date(purchase_date),
          purchase_order_no: generatePurchaseOrderNo(),
          sales_amount,
          exempt_amount,
          taxable_amount,
          gst_amount,
          total_invoice_amount,
          // created_by: parseInt(created_by),
          created_by: user.id,
          created_on: new Date(),
          // Payment fields
          payment_mode: payment_mode || null,
          transaction_id: transaction_id || null,
          cheque_number: cheque_number || null,
          journal_number: journal_number || null,
          bank_name: bank_name || null,

          items: {
            create: calculatedItems,
          },
        },
        include: {
          items: {
            include: {
              goods: true,
              service: true,
              unitObject: true,
            },
          },
        },
      });
    });

    return Response.json(
      {
        success: true,
        message: "Purchase created successfully",
        data: {
          purchase_id: purchase.purchase_id,
          purchase_order_no: purchase.purchase_order_no,
          total_invoice_amount: purchase.total_invoice_amount,
          purchase_date: purchase.purchase_date,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Purchase create error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
