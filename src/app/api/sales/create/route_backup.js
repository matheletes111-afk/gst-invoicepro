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
      customer_id,
      currency,
      customer_tpn,
      customer_name,
      sales_date,
      items,
      created_by,
      status = "IP"
    } = body;

    // Validate items exist
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        businessDetails: true,
        governmentAgencyDetail: true,
        corporationDetail: true,
        csoDetail: true,
      }
    })

    if (!organization) {
      return Response.json({
        success: false,
        error: "Organization not found"
      }, { status: 400 });
    }
    //org code
    let code = null;
    switch (organization.orgType) {
      case "business":
        code = organization.businessDetails.businessNameCode;
        break;
      case "government":
        code = organization.governmentAgencyDetail.agencyCode;
        break;
      case "corporation":
        code = organization.corporationDetail.organizationCode;
        break;
      case "cso":
        code = organization.csoDetail.agencyCode;
        break;
      default:
        throw new Error("Invalid organization type");
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

    // // Generate invoice number
    // const invoice_no = (() => {
    //   const prefix = "INV";
    //   const timestamp = Date.now().toString(36).toUpperCase();
    //   const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    //   return `${prefix}-${timestamp}-${random}`;
    // })();


    // Generate invoice number: (orgCode)/YYYYMMDD/10-digit-random
    const invoice_no = (() => {
      const orgCode = code;

      const today = new Date();
      const yyyymmdd = today.getFullYear().toString()
        + String(today.getMonth() + 1).padStart(2, "0")
        + String(today.getDate()).padStart(2, "0");

      const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000);

      return `${orgCode}/${yyyymmdd}${random10Digit}`;
    })();

    // Create sales with items in transaction
    const sales = await prisma.$transaction(async (tx) => {
      const sale = await tx.sales.create({
        data: {
          // Use relation fields instead of foreign key fields
          organization: {
            connect: { id: organizationId }
          },
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
          sales_invoice_no: invoice_no,
          status,
          created_by: parseInt(created_by),
          created_on: new Date(),
          items: {
            create: calculatedItems
          }
        },
        // Simple include
        include: {
          items: true
        }
      });

      return sale;
    });

    return Response.json({
      success: true,
      message: "Sales created successfully",
      data: {
        sales_id: sales.sales_id,
        sales_invoice_no: sales.sales_invoice_no,
        sales_amount: sales.sales_amount,
        sales_date: sales.sales_date
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating sales:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}