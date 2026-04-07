import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";


const generateSecondHandPurchaseOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `SHP-${year}${month}${day}-${randomNum}`;
};

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

// Function to update inventory
// Function to update inventory
const updateInventory = async (tx, item, organizationId, created_by,req) => {

  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itemType = item.purchase_item_type; // 'GOODS' or 'SERVICE'
  const itemId = itemType === 'GOODS' ? parseInt(item.goods_id) : parseInt(item.service_id);
  const unitId = parseInt(item.unit_of_measurement_id);
  const price = parseFloat(item.unit_price);
  const quantity = parseInt(item.quantity); // Changed to parseInt

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
    // Update existing inventory - increment quantity and recalculate inventory amount
    // Parse existing qty as integer to handle potential string values
    const existingQty = typeof existingInventory.qty === 'string'
      ? parseInt(existingInventory.qty)
      : Math.round(existingInventory.qty);

    const newQty = existingQty + quantity;
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
    // Create new inventory entry
    const inventoryAmount = quantity * price;

    const inventoryData = {
      unit_id: unitId,
      price: price,
      qty: quantity, // Already an integer
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

export async function POST(req) {
  try {
    // Get organizationId from JWT
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
      created_by,
      items,
      // Payment fields
      payment_mode,
      transaction_id,
      cheque_number,
      journal_number,
      bank_name,
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    if (!supplier_id && !body.supplier_name) {
      return Response.json(
        { success: false, error: "Supplier information is required" },
        { status: 400 }
      );
    }

    if (!currency) {
      return Response.json(
        { success: false, error: "Currency is required" },
        { status: 400 }
      );
    }

    if (!purchase_date) {
      return Response.json(
        { success: false, error: "Purchase date is required" },
        { status: 400 }
      );
    }

    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;

    // Validate and calculate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.unit_price || !item.quantity) {
        throw new Error(`Item ${i + 1}: Unit price and quantity are required`);
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);

      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new Error(`Item ${i + 1}: Invalid unit price`);
      }

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Item ${i + 1}: Invalid quantity`);
      }

      if (!Number.isInteger(quantity)) {
        throw new Error(`Item ${i + 1}: Quantity must be a whole number for second hand items`);
      }

      if (!item.unit_of_measurement_id) {
        throw new Error(`Item ${i + 1}: Unit of measurement is required`);
      }

      // Check if goods_id or service_id is provided based on type
      if (item.purchase_item_type === 'GOODS' && !item.goods_id) {
        throw new Error(`Item ${i + 1}: Goods ID is required for GOODS type`);
      }
      if (item.purchase_item_type === 'SERVICE' && !item.service_id) {
        throw new Error(`Item ${i + 1}: Service ID is required for SERVICE type`);
      }

      const gstRate = parseFloat(item.gst_percentage || 0);
      const values = calculateItemValues(item);

      sales_amount += values.amount_after_discount;

      if (gstRate === 0) {
        exempt_amount += values.amount_after_discount;
      } else {
        taxable_amount += values.amount_after_discount;
      }
    }

    const gst_amount = taxable_amount * 0.05;
    const total_invoice_amount = sales_amount + gst_amount;

    const result = await prisma.$transaction(async (tx) => {
      try {
        // Create the purchase
        const purchase = await tx.secondHandPurchase.create({
          data: {
            organization_id: parseInt(organizationId),
            supplier_id: supplier_id ? parseInt(supplier_id) : null,
            dealer_id: dealer_id ? parseInt(dealer_id) : null,
            currency: parseInt(currency),
            purchase_date: new Date(purchase_date),
            purchase_order_no: generateSecondHandPurchaseOrderNo(),
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
          },
        });

        // Create purchase items and update inventory
        const createdPurchaseItems = [];
        const updatedInventories = [];

        for (const item of items) {
          const values = calculateItemValues(item);
          const gstRate = parseFloat(item.gst_percentage || 0);

          // Create purchase item
          const purchaseItem = await tx.secondHandPurchaseItem.create({
            data: {
              purchase_id: purchase.purchase_id,
              purchase_item_type: item.purchase_item_type,
              goods_service_name: item.goods_service_name || null,
              goods_service_description: item.goods_service_description || null,
              unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
              unit_price: parseFloat(item.unit_price),
              quantity: parseInt(item.quantity),
              amount: values.amount,
              discount: values.discountAmount,
              amount_after_discount: values.amount_after_discount,
              gst_amount: values.gst_amount,
              gst_percentage: gstRate.toString(),
              goods_service_total_amount: values.goods_service_total_amount,
              // created_by: parseInt(created_by),
              created_by: user.id,
              created_on: new Date(),
              goods_id: item.purchase_item_type === "GOODS" ? parseInt(item.goods_id) : null,
              service_id: item.purchase_item_type === "SERVICE" ? parseInt(item.service_id) : null,
            },
          });

          createdPurchaseItems.push(purchaseItem);

          // Update inventory
          const inventory = await updateInventory(tx, item, organizationId, parseInt(created_by),req);
          updatedInventories.push(inventory);
        }

        // Get total inventory count for this organization
        const totalInventoryItems = await tx.inventoryMaster.count({
          where: { organization_id: organizationId }
        });

        return {
          success: true,
          purchase,
          purchaseItems: createdPurchaseItems,
          inventories: updatedInventories,
          totalInventoryItems
        };
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    });

    return Response.json(
      {
        success: true,
        message: "Second hand purchase created successfully",
        data: {
          purchase_id: result.purchase.purchase_id,
          purchase_order_no: result.purchase.purchase_order_no,
          total_invoice_amount: result.purchase.total_invoice_amount,
          purchase_date: result.purchase.purchase_date,
          total_items: result.purchaseItems.length,
          inventories_updated: result.inventories.length,
          total_inventory_items: result.totalInventoryItems,
          inventory_items: result.inventories.slice(0, 5).map(inv => ({
            inventory_id: inv.id,
            goods_id: inv.goods_id,
            service_id: inv.service_id,
            qty: inv.qty,
            price: inv.price,
            inventory_amount: inv.inventory_amount
          }))
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Second hand purchase create error:", error);

    // Return specific error messages
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.message.includes("Invalid") || error.message.includes("required")) {
      statusCode = 400;
    } else if (error.message.includes("Unauthorized")) {
      statusCode = 401;
    }

    return Response.json(
      {
        success: false,
        error: errorMessage
      },
      { status: statusCode }
    );
  }
}