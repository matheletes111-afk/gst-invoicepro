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

// Function to get organization code based on orgType
async function getOrganizationCode(organizationId) {
  const org = await prisma.organization.findUnique({
    where: { id: parseInt(organizationId) }
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  let organizationCode = '';

  switch (org.orgType) {
    // BUSINESS
    case 'business':
      const businessResult = await prisma.$queryRaw`
        SELECT businessNameCode 
        FROM BusinessDetails 
        WHERE organizationId = ${org.id} 
        LIMIT 1
      `;
      organizationCode = businessResult[0]?.businessNameCode || '';
      break;

    // GOVERNMENT AGENCY
    case 'government':
      const govResult = await prisma.$queryRaw`
        SELECT agencyCode 
        FROM GovernmentAgencyDetails 
        WHERE organizationId = ${org.id} 
        LIMIT 1
      `;
      organizationCode = govResult[0]?.agencyCode || '';
      break;

    // CORPORATION
    case 'corporation':
      const corpResult = await prisma.$queryRaw`
        SELECT organizationCode 
        FROM CorporationDetails 
        WHERE organizationId = ${org.id} 
        LIMIT 1
      `;
      organizationCode = corpResult[0]?.organizationCode || '';
      break;

    // CSO
    case 'cso':
      const csoResult = await prisma.$queryRaw`
        SELECT agencyCode 
        FROM CsoDetails 
        WHERE organizationId = ${org.id} 
        LIMIT 1
      `;
      organizationCode = csoResult[0]?.agencyCode || '';
      break;

    default:
      organizationCode = '';
  }

  return organizationCode;
}

// Function to generate unique adjustment note number
async function generateAdjustmentNoteNo(organizationId) {
  const orgCode = await getOrganizationCode(organizationId);

  // If organization code is empty, use default
  const formattedOrgCode = orgCode ? `${orgCode}/` : '';

  // Get current date for tax year and month
  const now = new Date();
  const taxYear = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM format

  // Generate 10 random digits
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  // Format: "organizationcode/ADN/taxyear/month/10 random digits"
  const adjustmentNoteNo = `${formattedOrgCode}ADN/${taxYear}/${month}/${randomDigits}`;

  // Check if this adjustment note number already exists
  const existingAdjustment = await prisma.adjustment.findFirst({
    where: { adjustment_note_no: adjustmentNoteNo }
  });

  // If exists, regenerate (very unlikely but just in case)
  if (existingAdjustment) {
    return generateAdjustmentNoteNo(organizationId);
  }

  return adjustmentNoteNo;
}

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
      sales_id,
      customer_id,
      currency,
      customer_tpn,
      customer_name,
      sales_date,
      items,
      created_by,
      status = "IP",
      remark,
      adjustment_type,
      adjustment_amount,
    } = body;

    // Validate required fields
    if (!sales_id) {
      return Response.json({
        success: false,
        error: "Sales ID is required"
      }, { status: 400 });
    }

    if (!customer_id) {
      return Response.json({
        success: false,
        error: "Customer ID is required"
      }, { status: 400 });
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
        error: "At least one adjustment item is required"
      }, { status: 400 });
    }

    // Check if sale exists and belongs to user's organization
    const existingSale = await prisma.sales.findUnique({
      where: { sales_id: parseInt(sales_id) },
      include: {
        items: true
      }
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

    // Check if adjustment already exists for this sale
    const existingAdjustment = await prisma.adjustment.findFirst({
      where: { sale_id: parseInt(sales_id) },
      include: {
        adjustmentItems: true
      }
    });

    // Calculate totals for adjustment
    let sales_amount = 0;
    let exempt_amount = 0;
    let taxable_amount = 0;
    let total_adjustment_amount = 0;
    let effect_on_gst_payable = 0;

    const calculatedItems = items.map(item => {
      // Validate required fields
      if (!item.unit_price || !item.quantity) {
        throw new Error(`Unit price and quantity are required`);
      }

      const unitPrice = parseFloat(item.unit_price);
      const quantity = parseFloat(item.quantity);
      const gstRate = parseFloat(item.gst_rate || 0);
      const adjustmentAmount = parseFloat(item.adjustment_amount || 0);

      if (isNaN(unitPrice) || isNaN(quantity) || unitPrice <= 0 || quantity <= 0) {
        throw new Error(`Invalid unit price or quantity`);
      }

      // Calculate all item values
      const itemValues = calculateItemValues(item);

      // Update adjustment totals
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

      // Update adjustment-specific totals
      total_adjustment_amount += adjustmentAmount;

      // Determine adjustment type (default to "NONE" if empty)
      const adjustmentType = item.adjustment_type && item.adjustment_type.trim() !== ''
        ? item.adjustment_type
        : 'NONE';

      // Calculate effect on GST payable based on adjustment type
      // if (adjustmentType === 'CREDIT') {
      //   // For credit adjustments, GST is reduced (negative effect)
      //   effect_on_gst_payable -= itemValues.gst_amount;
      // } else if (adjustmentType === 'DEBIT') {
      //   // For debit adjustments, GST is increased (positive effect)
      //   effect_on_gst_payable += itemValues.gst_amount;
      // }

      if (adjustmentType === 'CREDIT') {
        // Credit adjustment means you owe less GST (negative amount)
        effect_on_gst_payable += itemValues.gst_amount; // Should be +
      } else if (adjustmentType === 'DEBIT') {
        // Debit adjustment means you owe more GST (positive amount)
        effect_on_gst_payable -= itemValues.gst_amount; // Should be -
      }
      // NONE has no effect on GST payable

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
        reason_for_adjustment: item.adjustment_reason || null,
        adjustment_type: adjustmentType,
        adjustment_amount: adjustmentAmount,
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

    // Calculate GST amount (5% of taxable amount)
    const gst_amount = taxable_amount > 0 ? taxable_amount * 0.05 : 0;

    // Calculate total invoice amount
    const total_invoice_amount = exempt_amount + taxable_amount + gst_amount;

    // Create or update adjustment with items in transaction
    const adjustment = await prisma.$transaction(async (tx) => {
      if (existingAdjustment) {
        // UPDATE existing adjustment
        // Delete existing adjustment items
        await tx.adjustmentItem.deleteMany({
          where: { adjustment_id: existingAdjustment.adjustment_id }
        });

        // Update adjustment record
        const updatedAdjustment = await tx.adjustment.update({
          where: { adjustment_id: existingAdjustment.adjustment_id },
          data: {
            date: new Date(),
            sales_amount,
            exempt_amount,
            taxable_amount,
            gst_amount,
            total_invoice_amount,
            total_adjustment_amount,
            effect_on_gst_payable,
            status,
            remark: remark,
            adjustment_type: adjustment_type,
            adjustment_amount: adjustment_amount,
            // Connect relations
            organization: {
              connect: { id: organizationId }
            },
            customer: {
              connect: { partyId: parseInt(customer_id) }
            },
            adjustmentItems: {
              create: calculatedItems
            }
          },
          include: {
            adjustmentItems: true
          }
        });

        return updatedAdjustment;
      } else {
        // CREATE new adjustment
        // Generate adjustment note number
        const adjustment_note_no = await generateAdjustmentNoteNo(organizationId);

        const newAdjustment = await tx.adjustment.create({
          data: {
            adjustment_note_no,
            date: new Date(),
            invoice_no: existingSale.sales_invoice_no,
            sales_amount,
            exempt_amount,
            taxable_amount,
            gst_amount,
            total_invoice_amount,
            total_adjustment_amount,
            effect_on_gst_payable,
            status,
            // created_by: parseInt(created_by),
            created_by: user.id,
            created_on: new Date(),
            remark: remark,
            adjustment_type: adjustment_type,
            adjustment_amount: adjustment_amount,
            // Connect relations
            organization: {
              connect: { id: organizationId }
            },
            customer: {
              connect: { partyId: parseInt(customer_id) }
            },
            invoice: {
              connect: { sales_id: parseInt(sales_id) }
            },
            adjustmentItems: {
              create: calculatedItems
            }
          },
          include: {
            adjustmentItems: true
          }
        });

        return newAdjustment;
      }
    });

    const message = existingAdjustment
      ? "Adjustment updated successfully"
      : "Adjustment created successfully";

    return Response.json({
      success: true,
      message,
      data: {
        adjustment_id: adjustment.adjustment_id,
        adjustment_note_no: adjustment.adjustment_note_no,
        invoice_no: adjustment.invoice_no,
        sales_amount: adjustment.sales_amount,
        total_adjustment_amount: adjustment.total_adjustment_amount,
        date: adjustment.date,
        status: adjustment.status
      }
    }, { status: existingAdjustment ? 200 : 201 });

  } catch (error) {
    console.error("Error processing adjustment:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}