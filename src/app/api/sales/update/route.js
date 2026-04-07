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

// Helper function to create individual customer
const createIndividualCustomer = async (customerData, organizationId) => {
  try {
    const {
      name,
      cid,
      taxPayerRegNo,
      taxPayerRegion,
      email,
      phone,
      taxPayerRegStatus = 'NO'
    } = customerData;

    // Validate required fields
    if (!name) {
      throw new Error('Customer name is required');
    }

    // First create party record
    const party = await prisma.Party.create({
      data: {
        partyType: 'INDIVIDUAL',
        organizationId: organizationId,
        status: 'A'
      }
    });

    // Then create individual party record
    const individualParty = await prisma.IndividualParty.create({
      data: {
        partyId: party.partyId,
        cid: cid || null,
        name: name,
        taxPayerRegStatus: taxPayerRegStatus || 'NO',
        taxPayerRegNo: taxPayerRegNo || null,
        taxPayerRegion: taxPayerRegion || null,
        email: email || null,
        phone: phone || null
      }
    });

    return {
      partyId: party.partyId,
      name: individualParty.name,
      cid: individualCustomerData.cid,
      taxPayerRegNo: individualParty.taxPayerRegNo,
      taxPayerRegion: individualParty.taxPayerRegion,
      email: individualParty.email,
      phone: individualParty.phone
    };
  } catch (error) {
    console.error('Error creating individual customer:', error);
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


    const {
      sales_id,
      customer_id,
      currency,
      customer_tpn,
      customer_name,
      sales_date,
      items,
      created_by,
      status = "IP",
      // New fields from create functionality
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

    let finalCustomerId = customer_id;
    let finalCustomerName = customer_name;
    let finalCustomerTpn = customer_tpn;

    // Check if we need to create a new customer
    if (create_new_customer && new_customer_data && party_type === 'INDIVIDUAL') {
      try {
        const newCustomer = await createIndividualCustomer(new_customer_data, organizationId);
        finalCustomerId = newCustomer.partyId;
        finalCustomerName = newCustomer.name;
        finalCustomerTpn = newCustomer.taxPayerRegNo;

        console.log('Created new customer for edit:', {
          id: finalCustomerId,
          name: finalCustomerName,
          tpn: finalCustomerTpn
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: `Failed to create customer: ${error.message}`
        }, { status: 400 });
      }
    }

    // Validate customer_id exists
    if (!finalCustomerId) {
      return Response.json({
        success: false,
        error: "Customer ID is required"
      }, { status: 400 });
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
        // created_by: parseInt(created_by),
        created_by: user.id,
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
        itemData.service = undefined;
      } else {
        itemData.service = {
          connect: { service_id: parseInt(item.goods_services_id) }
        };
        itemData.goods = undefined;
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
          customer: {
            connect: { partyId: parseInt(finalCustomerId) }
          },
          currency_info: {
            connect: { currencyId: parseInt(currency) }
          },
          customer_tpn: finalCustomerTpn || null,
          customer_name: finalCustomerName || null,
          sales_date: new Date(sales_date),
          sales_amount,
          exempt_amount,
          taxable_amount,
          gst_amount: taxable_amount > 0 ? taxable_amount * 0.05 : 0,
          total_invoice_amount: exempt_amount + taxable_amount + (taxable_amount > 0 ? taxable_amount * 0.05 : 0),
          status: status || existingSale.status,
          // Payment fields
          payment_mode: payment_mode || null,
          transaction_id: transaction_id || null,
          cheque_number: cheque_number || null,
          journal_number: journal_number || null,
          bank_name: bank_name || null,
          // Items
          items: {
            create: calculatedItems
          }
        },
        include: {
          items: true
        }
      });


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
              payload: sale,
            },
          });
        }
      } catch (logError) {
        console.error('Activity logging failed:', logError);
      }

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
        status: updatedSales.status,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        customer_tpn: finalCustomerTpn,
        payment_mode: updatedSales.payment_mode
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