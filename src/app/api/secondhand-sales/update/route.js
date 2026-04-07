import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

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

// Inventory management function for update (restore old, deduct new)
const updateInventoryForEdit = async (tx, oldItems, newItems, organizationId, created_by, req) => {
  // First, restore inventory from old items (add back what was sold)
  for (const oldItem of oldItems) {
    const itemType = oldItem.sales_item_type;
    const itemId = itemType === 'GOODS' ? oldItem.goods_id : oldItem.service_id;
    const unitId = oldItem.unit_of_measurement_id;
    const purchaseAmount = parseFloat(oldItem.purchase_amount);
    const oldQuantity = parseFloat(oldItem.quantity);

    // Check if inventory exists - SEARCH USING PURCHASE AMOUNT
    const existingInventory = await tx.inventoryMaster.findFirst({
      where: {
        organization_id: organizationId,
        unit_id: unitId,
        price: purchaseAmount, // Use purchase_amount, not unit_price
        OR: [
          { goods_id: itemType === 'GOODS' ? itemId : null },
          { service_id: itemType === 'SERVICE' ? itemId : null }
        ]
      }
    });

    if (existingInventory) {
      // Restore inventory by adding back the old quantity
      const existingQty = parseFloat(existingInventory.qty);
      const newQty = existingQty + oldQuantity;
      const newInventoryAmount = newQty * purchaseAmount;

      await tx.inventoryMaster.update({
        where: { id: existingInventory.id },
        data: {
          qty: newQty,
          inventory_amount: newInventoryAmount,
          updated_at: new Date(),
        }
      });
    } else {
      // If inventory doesn't exist, create new entry with restored quantity
      const inventoryData = {
        unit_id: unitId,
        price: purchaseAmount, // Use purchase_amount
        qty: oldQuantity,
        inventory_amount: oldQuantity * purchaseAmount,
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      };

      if (itemType === 'GOODS') {
        inventoryData.goods_id = itemId;
      } else {
        inventoryData.service_id = itemId;
      }

      await tx.inventoryMaster.create({
        data: inventoryData
      });
    }
  }

  // Then, deduct inventory for new items
  for (const newItem of newItems) {
    const itemType = newItem.sales_item_type;
    const itemId = itemType === 'GOODS' ? parseInt(newItem.goods_services_id) : parseInt(newItem.goods_services_id);
    const unitId = parseInt(newItem.unit_of_measurement_id);
    const purchaseAmount = parseFloat(newItem.purchase_amount || 0); // Use purchase_amount
    const newQuantity = parseFloat(newItem.quantity);

    if (!purchaseAmount || isNaN(purchaseAmount)) {
      throw new Error(`Purchase amount is required for ${newItem.goods_service_name || 'item'}`);
    }

    // Check if inventory already exists - SEARCH USING PURCHASE AMOUNT
    const existingInventory = await tx.inventoryMaster.findFirst({
      where: {
        organization_id: organizationId,
        unit_id: unitId,
        price: purchaseAmount, // Use purchase_amount
        OR: [
          { goods_id: itemType === 'GOODS' ? itemId : null },
          { service_id: itemType === 'SERVICE' ? itemId : null }
        ]
      }
    });

    if (!existingInventory) {
      throw new Error(`Inventory not found for ${newItem.goods_service_name || 'item'} with purchase price ${purchaseAmount}. Cannot process sale update.`);
    }

    // Parse existing qty as decimal
    const existingQty = parseFloat(existingInventory.qty);

    // Check if new quantity would go negative
    if (existingQty < newQuantity) {
      throw new Error(`Insufficient inventory for ${newItem.goods_service_name || 'item'}. Current stock: ${existingQty}, attempted to sell: ${newQuantity}`);
    }

    // Deduct new quantity from inventory
    const newQty = existingQty - newQuantity;
    const newInventoryAmount = newQty * purchaseAmount;

    await tx.inventoryMaster.update({
      where: { id: existingInventory.id },
      data: {
        qty: newQty,
        inventory_amount: newInventoryAmount,
        updated_at: new Date(),
      }
    });
  }
};

// Helper function to create customer (reuse from create API)
const createCustomer = async (customerData, partyType, organizationId) => {
  try {
    const {
      name,
      cid,
      taxPayerRegNo,
      taxPayerRegion,
      email,
      phone,
      taxPayerRegStatus = 'NO',
      // For other party types
      businessName,
      licenseNo,
      companyRegistrationNo,
      agencyName,
      corporationName,
      csoName,
      csoRegistrationNo
    } = customerData;

    // Validate required fields
    if (!name && !businessName && !agencyName && !corporationName && !csoName) {
      throw new Error('Customer name is required');
    }

    // First create party record
    const party = await prisma.Party.create({
      data: {
        partyType: partyType,
        organizationId: organizationId,
        status: 'A'
      }
    });

    let customerDetails = {};

    switch (partyType) {
      case 'INDIVIDUAL':
        const individualParty = await prisma.IndividualParty.create({
          data: {
            partyId: party.partyId,
            cid: cid || null,
            name: name,
            taxPayerRegStatus: taxPayerRegNo ? 'YES' : 'NO',
            taxPayerRegNo: taxPayerRegNo || null,
            taxPayerRegion: taxPayerRegion || null,
            email: email || null,
            phone: phone || null
          }
        });
        customerDetails = {
          partyId: party.partyId,
          name: individualParty.name,
          cid: individualParty.cid,
          taxPayerRegNo: individualParty.taxPayerRegNo,
          taxPayerRegion: individualParty.taxPayerRegion,
          email: individualParty.email,
          phone: individualParty.phone
        };
        break;

      case 'BUSINESS':
        const businessParty = await prisma.BusinessParty.create({
          data: {
            partyId: party.partyId,
            licenseNo: licenseNo || null,
            businessName: businessName || name,
            companyRegistrationNo: companyRegistrationNo || null,
            taxPayerRegStatus: taxPayerRegStatus || 'NO',
            taxPayerRegNo: taxPayerRegNo || null,
            taxPayerRegion: taxPayerRegion || null,
            address: customerData.address || null,
            officeEmail: email || null,
            officePhone: phone || null
          }
        });
        customerDetails = {
          partyId: party.partyId,
          name: businessParty.businessName,
          licenseNo: businessParty.licenseNo,
          taxPayerRegNo: businessParty.taxPayerRegNo,
          companyRegistrationNo: businessParty.companyRegistrationNo
        };
        break;

      case 'CORPORATION':
        const corporationParty = await prisma.CorporationParty.create({
          data: {
            partyId: party.partyId,
            corporationName: corporationName || name,
            taxPayerRegStatus: taxPayerRegStatus || 'NO',
            taxPayerRegNo: taxPayerRegNo || null,
            taxPayerRegion: taxPayerRegion || null,
            address: customerData.address || null,
            officeEmail: email || null,
            officePhone: phone || null
          }
        });
        customerDetails = {
          partyId: party.partyId,
          name: corporationParty.corporationName,
          taxPayerRegNo: corporationParty.taxPayerRegNo
        };
        break;

      default:
        throw new Error(`Unsupported party type: ${partyType}`);
    }

    return customerDetails;

  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
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
      second_hand_sales_id,
      customer_id,
      currency,
      customer_tpn,
      customer_name,
      sales_date,
      items,
      created_by,
      status,
      // New fields for customer creation
      create_new_customer = false,
      new_customer_data = null,
      party_type = 'INDIVIDUAL',
      // Payment fields
      payment_mode,
      transaction_id,
      cheque_number,
      journal_number,
      bank_name
    } = body;

    if (!second_hand_sales_id) {
      return Response.json({
        success: false,
        error: "Second Hand Sales ID is required"
      }, { status: 400 });
    }

    const salesId = parseInt(second_hand_sales_id);

    // Check if sale exists and belongs to user's organization
    const existingSale = await prisma.secondHandSale.findUnique({
      where: { second_hand_sales_id: salesId },
      include: {
        items: true
      }
    });

    if (!existingSale) {
      return Response.json({
        success: false,
        error: "Second hand sales not found"
      }, { status: 404 });
    }

    // Verify that the sales belongs to user's organization
    if (existingSale.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this sales record"
      }, { status: 403 });
    }

    let finalCustomerId = customer_id || existingSale.customer_id;
    let finalCustomerName = customer_name || existingSale.customer_name;
    let finalCustomerTpn = customer_tpn || existingSale.customer_tpn;

    // Check if we need to create a new customer
    if (create_new_customer && new_customer_data) {
      try {
        const newCustomer = await createCustomer(new_customer_data, party_type, organizationId);
        finalCustomerId = newCustomer.partyId;
        finalCustomerName = newCustomer.name;
        finalCustomerTpn = newCustomer.taxPayerRegNo;

        console.log('Created new customer for edit:', {
          id: finalCustomerId,
          name: finalCustomerName,
          tpn: finalCustomerTpn,
          type: party_type
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: `Failed to create customer: ${error.message}`
        }, { status: 400 });
      }
    }

    // Validate items exist
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

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

    // Calculate totals for sales and validate items with inventory
    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;
    const inventoryValidation = [];

    // First, temporarily restore inventory for validation
    // We need to check inventory after restoring old items
    const tempInventoryState = new Map();

    // Calculate what the inventory would be after restoring old items
    for (const oldItem of existingSale.items) {
      const key = `${oldItem.unit_of_measurement_id}_${oldItem.purchase_amount}_${oldItem.sales_item_type === 'GOODS' ? oldItem.goods_id : oldItem.service_id}`;
      if (!tempInventoryState.has(key)) {
        // Get current inventory
        const currentInventory = await prisma.inventoryMaster.findFirst({
          where: {
            organization_id: organizationId,
            unit_id: oldItem.unit_of_measurement_id,
            price: parseFloat(oldItem.purchase_amount),
            OR: [
              { goods_id: oldItem.sales_item_type === 'GOODS' ? oldItem.goods_id : null },
              { service_id: oldItem.sales_item_type === 'SERVICE' ? oldItem.service_id : null }
            ]
          }
        });

        if (currentInventory) {
          tempInventoryState.set(key, {
            currentQty: parseFloat(currentInventory.qty),
            oldQuantity: 0
          });
        }
      }

      const state = tempInventoryState.get(key);
      if (state) {
        state.oldQuantity += parseFloat(oldItem.quantity);
      }
    }

    const calculatedItems = await Promise.all(items.map(async (item) => {
      // Validate required fields
      if (!item.unit_price || !item.quantity || !item.sales_item_type || !item.goods_services_id || !item.unit_of_measurement_id) {
        throw new Error(`All item fields are required: unit_price, quantity, sales_item_type, goods_services_id, unit_of_measurement_id`);
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);
      const gstRate = parseFloat(item.gst_rate || 0);
      const purchaseAmount = parseFloat(item.purchase_amount || 0);

      if (isNaN(unitPrice) || isNaN(quantity) || unitPrice <= 0 || quantity <= 0) {
        throw new Error(`Invalid unit price or quantity`);
      }

      if (!purchaseAmount || isNaN(purchaseAmount) || purchaseAmount <= 0) {
        throw new Error(`Purchase amount is required and must be greater than 0`);
      }

      // Check if goods/service exists and get details
      let goodsDetails = null;
      let serviceDetails = null;

      if (item.sales_item_type === 'GOODS') {
        goodsDetails = await prisma.goodsCatalog.findUnique({
          where: { goodsId: parseInt(item.goods_services_id) }
        });
        if (!goodsDetails) {
          throw new Error(`Goods with ID ${item.goods_services_id} not found`);
        }
      } else {
        serviceDetails = await prisma.serviceCatalog.findUnique({
          where: { service_id: parseInt(item.goods_services_id) }
        });
        if (!serviceDetails) {
          throw new Error(`Service with ID ${item.goods_services_id} not found`);
        }
      }

      // For edit validation, we need to check inventory after restoring old items
      const key = `${parseInt(item.unit_of_measurement_id)}_${purchaseAmount}_${parseInt(item.goods_services_id)}`;

      // Check inventory availability before proceeding - SEARCH USING PURCHASE AMOUNT
      const existingInventory = await prisma.inventoryMaster.findFirst({
        where: {
          organization_id: organizationId,
          unit_id: parseInt(item.unit_of_measurement_id),
          price: purchaseAmount, // Use purchase_amount, not unit_price
          OR: [
            { goods_id: item.sales_item_type === 'GOODS' ? parseInt(item.goods_services_id) : null },
            { service_id: item.sales_item_type === 'SERVICE' ? parseInt(item.goods_services_id) : null }
          ]
        }
      });

      if (!existingInventory) {
        throw new Error(`No inventory found for ${item.sales_item_type === 'GOODS' ? 'goods' : 'service'} ID ${item.goods_services_id} with purchase price ${purchaseAmount}`);
      }

      // For edit mode, we need to consider that old items will be restored first
      const existingQty = parseFloat(existingInventory.qty);
      let availableQty = existingQty;

      // If this is an existing item being edited (same inventory), add back the old quantity
      // First check if this item exists in the old sale
      const oldItem = existingSale.items.find(old =>
        old.unit_of_measurement_id === parseInt(item.unit_of_measurement_id) &&
        parseFloat(old.purchase_amount) === purchaseAmount &&
        ((item.sales_item_type === 'GOODS' && old.goods_id === parseInt(item.goods_services_id)) ||
          (item.sales_item_type === 'SERVICE' && old.service_id === parseInt(item.goods_services_id)))
      );

      if (oldItem) {
        // This is an existing item, add back its old quantity for validation
        const oldQuantity = parseFloat(oldItem.quantity);
        availableQty += oldQuantity;
      }

      // Check if there's enough stock after considering restored quantity
      if (availableQty < quantity) {
        throw new Error(`Insufficient inventory for ${item.goods_service_name || (goodsDetails?.goodsName || serviceDetails?.serviceName)}. Available after restore: ${availableQty}, requested: ${quantity}`);
      }

      // Store inventory info for validation
      inventoryValidation.push({
        item,
        existingInventory,
        quantity
      });

      // Calculate all item values
      const itemValues = calculateItemValues(item);

      // Update sales totals
      sales_amount += itemValues.amount_after_discount;

      // Check if exempt (GST rate = 0)
      if (gstRate === 0) {
        exempt_amount += itemValues.amount_after_discount;
      } else {
        taxable_amount += itemValues.amount_after_discount;
      }

      // Prepare item data
      const itemData = {
        sales_item_type: item.sales_item_type,
        inventory_id: existingInventory.id,
        purchase_amount: purchaseAmount, // Store purchase_amount
        goods_service_name: item.goods_service_name || (goodsDetails?.goodsName || serviceDetails?.serviceName) || null,
        goods_service_description: item.goods_service_description || (goodsDetails?.description || serviceDetails?.description) || null,
        unit_price: unitPrice,
        quantity: quantity,
        amount: itemValues.amount,
        discount: itemValues.discountAmount,
        amount_after_discount: itemValues.amount_after_discount,
        gst_amount: itemValues.gst_amount,
        gst_percentage: String(item.gst_rate ?? ""),
        goods_service_total_amount: itemValues.goods_service_total_amount,
        // created_by: parseInt(created_by) || existingSale.created_by,
        created_by: user.id,
        created_on: new Date(),
        // Connect relations
        unit: {
          connect: { id: parseInt(item.unit_of_measurement_id) }
        }
      };

      // Connect goods or service based on type
      if (item.sales_item_type === 'GOODS') {
        itemData.goods = {
          connect: { goodsId: parseInt(item.goods_services_id) }
        };
        itemData.service = undefined;
      } else {
        itemData.service = {
          connect: { service_id: parseInt(item.goods_services_id) }
        };
        itemData.goods = undefined;
      }

      return itemData;
    }));

    // Update sales with items and update inventory in transaction
    const updatedSales = await prisma.$transaction(async (tx) => {
      // 1. First, restore old inventory and deduct new inventory
      await updateInventoryForEdit(tx, existingSale.items, items, organizationId, created_by || existingSale.created_by, req);

      // 2. Delete existing items
      await tx.secondHandSaleItem.deleteMany({
        where: { second_hand_sales_id: salesId }
      });

      // 3. Update sales record
      const sale = await tx.secondHandSale.update({
        where: { second_hand_sales_id: salesId },
        data: {
          customer_id: parseInt(finalCustomerId),
          currency: parseInt(currency) || existingSale.currency,
          customer_tpn: finalCustomerTpn || null,
          customer_name: finalCustomerName || null,
          sales_date: sales_date ? new Date(sales_date) : existingSale.sales_date,
          sales_amount,
          exempt_amount,
          taxable_amount,
          gst_amount: taxable_amount > 0 ? taxable_amount * 0.05 : 0,
          total_invoice_amount: exempt_amount + taxable_amount + (taxable_amount > 0 ? taxable_amount * 0.05 : 0),
          status: status || existingSale.status,
          // Payment fields
          payment_mode: payment_mode !== undefined ? payment_mode : existingSale.payment_mode,
          transaction_id: transaction_id !== undefined ? transaction_id : existingSale.transaction_id,
          cheque_number: cheque_number !== undefined ? cheque_number : existingSale.cheque_number,
          journal_number: journal_number !== undefined ? journal_number : existingSale.journal_number,
          bank_name: bank_name !== undefined ? bank_name : existingSale.bank_name,
          // Items
          items: {
            create: calculatedItems
          }
        },
        include: {
          items: {
            include: {
              goods: true,
              service: true,
              unit: true
            }
          }
        }
      });

      return sale;
    }, {
      timeout: 15000 // Increase timeout for complex inventory updates
    });

    return Response.json({
      success: true,
      message: "Second hand sales updated successfully",
      data: {
        second_hand_sales_id: updatedSales.second_hand_sales_id,
        sales_invoice_no: updatedSales.sales_invoice_no,
        sales_amount: updatedSales.sales_amount,
        sales_date: updatedSales.sales_date,
        status: updatedSales.status,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        customer_tpn: finalCustomerTpn,
        payment_mode: updatedSales.payment_mode,
        items: updatedSales.items
      }
    });

  } catch (error) {
    console.error("Error updating second hand sales:", error);
    return Response.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}