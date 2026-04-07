import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";


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

// Function to update inventory with validation
const updateInventory = async (tx, item, organizationId, created_by, isUpdate = false, oldQuantity = 0,req) => {
  const itemType = item.purchase_item_type; // 'GOODS' or 'SERVICE'
  const itemId = itemType === 'GOODS' ? parseInt(item.goods_id) : parseInt(item.service_id);
  const unitId = parseInt(item.unit_of_measurement_id);
  const price = parseFloat(item.unit_price);
  const quantity = parseInt(item.quantity); // New quantity

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
      // For create operation: add new quantity
      newQty = existingQty + quantity;
    }
    
    // Check if new quantity would go negative
    if (newQty < 0) {
      throw new Error(`Insufficient inventory for ${item.goods_service_name || 'item'}. Current stock: ${existingQty}, attempted to reduce by ${Math.abs(quantity - oldQuantity)}`);
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
    // For update operation, if inventory doesn't exist but we're trying to reduce stock
    if (isUpdate && oldQuantity > 0) {
      throw new Error(`Inventory not found for ${item.goods_service_name || 'item'}. Cannot update stock.`);
    }
    
    // Create new inventory entry
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
      created_by,
      // Payment fields
      payment_mode,
      transaction_id,
      cheque_number,
      journal_number,
      bank_name,
      // Totals from frontend
      sales_amount,
      exempt_amount,
      taxable_amount,
      gst_amount,
      total_invoice_amount,
    } = body;

    if (!purchase_id) {
      return Response.json({
        success: false,
        error: "Purchase ID is required"
      }, { status: 400 });
    }

    // Check if purchase exists and belongs to user's organization
    const existingPurchase = await prisma.secondHandPurchase.findUnique({
      where: { purchase_id: parseInt(purchase_id) },
      include: {
        items: true // Only include purchase items
      }
    });

    if (!existingPurchase) {
      return Response.json({
        success: false,
        error: "Secondhand purchase not found"
      }, { status: 404 });
    }

    // Verify that the purchase belongs to user's organization
    if (existingPurchase.organization_id !== organizationId) {
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

    // Validate and prepare items for database
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

      // Check if quantity is integer
      if (!Number.isInteger(quantity)) {
        throw new Error(`Quantity must be a whole number for second hand items`);
      }

      // Prepare item data for secondhand purchase - using the calculated values from frontend
      const values = calculateItemValues(item);
      
      const itemData = {
        purchase_item_type: item.purchase_item_type,
        goods_service_name: item.goods_service_name || null,
        goods_service_description: item.goods_service_description || null,
        unit_of_measurement_id: parseInt(item.unit_of_measurement_id),
        unit_price: unitPrice,
        quantity: quantity,
        amount: values.amount,
        discount: values.discountAmount,
        amount_after_discount: values.amount_after_discount,
        gst_amount: values.gst_amount,
        gst_percentage: String(values.gstRate || ""),
        goods_service_total_amount: values.goods_service_total_amount,
        // created_by: parseInt(created_by),
        created_by: user.id,
        created_on: new Date(),
        // Set goods_id or service_id based on type
        goods_id: item.purchase_item_type === 'GOODS' && item.goods_id ? parseInt(item.goods_id) : null,
        service_id: item.purchase_item_type === 'SERVICE' && item.service_id ? parseInt(item.service_id) : null,
      };

      return itemData;
    });

    // Update purchase with items in transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // First, get old items to track inventory changes
      const oldItems = await tx.secondHandPurchaseItem.findMany({
        where: { purchase_id: parseInt(purchase_id) }
      });

      // Validate inventory changes before making any updates
      for (const newItem of calculatedItems) {
        // Find if this item existed in old items (by goods_id/service_id and price)
        const oldItem = oldItems.find(old => {
          if (newItem.purchase_item_type === 'GOODS' && newItem.goods_id) {
            return old.goods_id === newItem.goods_id && 
                   old.unit_price === newItem.unit_price &&
                   old.unit_of_measurement_id === newItem.unit_of_measurement_id;
          } else if (newItem.purchase_item_type === 'SERVICE' && newItem.service_id) {
            return old.service_id === newItem.service_id && 
                   old.unit_price === newItem.unit_price &&
                   old.unit_of_measurement_id === newItem.unit_of_measurement_id;
          }
          return false;
        });

        if (oldItem) {
          // Check if quantity is being reduced
          if (newItem.quantity < oldItem.quantity) {
            // Check inventory to ensure we don't go negative
            const existingInventory = await tx.inventoryMaster.findFirst({
              where: {
                organization_id: organizationId,
                unit_id: newItem.unit_of_measurement_id,
                price: newItem.unit_price,
                OR: [
                  { goods_id: newItem.purchase_item_type === 'GOODS' ? newItem.goods_id : null },
                  { service_id: newItem.purchase_item_type === 'SERVICE' ? newItem.service_id : null }
                ]
              }
            });

            if (existingInventory) {
              const existingQty = typeof existingInventory.qty === 'string' 
                ? parseInt(existingInventory.qty) 
                : Math.round(existingInventory.qty);
              const quantityDiff = newItem.quantity - oldItem.quantity;
              
              if (existingQty + quantityDiff < 0) {
                const itemName = newItem.goods_service_name || 'item';
                throw new Error(`Cannot reduce quantity for ${itemName}. Current inventory: ${existingQty}, attempted to reduce by ${Math.abs(quantityDiff)}`);
              }
            }
          }
        }
      }

      // Reverse old inventory (subtract old quantities)
      for (const oldItem of oldItems) {
        const itemForInventory = {
          purchase_item_type: oldItem.goods_id ? 'GOODS' : 'SERVICE',
          goods_id: oldItem.goods_id,
          service_id: oldItem.service_id,
          goods_service_name: oldItem.goods_service_name,
          unit_of_measurement_id: oldItem.unit_of_measurement_id,
          unit_price: oldItem.unit_price,
          quantity: -oldItem.quantity, // Negative to subtract
          gst_rate: parseFloat(oldItem.gst_percentage || 0)
        };

        // This will reduce inventory by old quantity
        await updateInventory(tx, itemForInventory, organizationId, parseInt(created_by), true, 0,req);
      }

      // Delete existing purchase items
      await tx.secondHandPurchaseItem.deleteMany({
        where: { purchase_id: parseInt(purchase_id) }
      });

      // Prepare purchase update data for secondhand purchase
      const purchaseUpdateData = {
        purchase_date: new Date(purchase_date),
        purchase_order_no: purchase_order_no || existingPurchase.purchase_order_no,
        sales_amount: parseFloat(sales_amount || 0),
        exempt_amount: parseFloat(exempt_amount || 0),
        taxable_amount: parseFloat(taxable_amount || 0),
        gst_amount: parseFloat(gst_amount || 0),
        total_invoice_amount: parseFloat(total_invoice_amount || 0),
        // Payment fields
        payment_mode: payment_mode || existingPurchase.payment_mode,
        transaction_id: transaction_id || existingPurchase.transaction_id,
        cheque_number: cheque_number || existingPurchase.cheque_number,
        journal_number: journal_number || existingPurchase.journal_number,
        bank_name: bank_name || existingPurchase.bank_name,
      };

      // Update purchase record
      const purchase = await tx.secondHandPurchase.update({
        where: { purchase_id: parseInt(purchase_id) },
        data: purchaseUpdateData
      });

      // Create new purchase items
      const createdItems = await tx.secondHandPurchaseItem.createMany({
        data: calculatedItems.map(item => ({
          ...item,
          purchase_id: parseInt(purchase_id),
        }))
      });

      // Update inventory with new quantities
      for (const item of calculatedItems) {
        await updateInventory(tx, item, organizationId, parseInt(created_by), true, 0);
      }

      // Get the updated purchase with items
      const purchaseWithItems = await tx.secondHandPurchase.findUnique({
        where: { purchase_id: parseInt(purchase_id) },
        include: {
          items: {
            include: {
              goods: true,
              service: true,
              unitObject: true,
            }
          },
          supplier: true,
          dealer: true,
          currency_info: true,
          organization: true
        }
      });

      return purchaseWithItems;
    });

    return Response.json({
      success: true,
      message: "Secondhand purchase updated successfully",
      data: {
        purchase_id: updatedPurchase.purchase_id,
        purchase_order_no: updatedPurchase.purchase_order_no,
        total_invoice_amount: updatedPurchase.total_invoice_amount,
        purchase_date: updatedPurchase.purchase_date,
        supplier: updatedPurchase.supplier,
        dealer: updatedPurchase.dealer,
        item_count: updatedPurchase.items?.length || 0
      }
    });

  } catch (error) {
    console.error("Error updating secondhand purchase:", error);
    
    // Check if error is about inventory
    let statusCode = 500;
    if (error.message.includes("Cannot reduce quantity") || 
        error.message.includes("Insufficient inventory") ||
        error.message.includes("Inventory not found")) {
      statusCode = 400;
    }
    
    return Response.json({
      success: false,
      error: error.message || "An error occurred while updating the purchase"
    }, { status: statusCode });
  }
}