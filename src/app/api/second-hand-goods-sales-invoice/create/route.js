import prisma from "@/lib/prisma";
import { generateInvoiceNumber, numberToWords } from "@/lib/invoiceNumberGenerator";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Unauthorized: Organization ID not found in token" 
      }), { status: 401 });
    }

    const body = await req.json();
    const { 
      invoiceDate,
      isOriginal,
      salesOrderId,
      partyId,
      customerName,
      customerTPN,
      customerAddress,
      customerEmail,
      customerPhone,
      currencyId,
      items,
      exemptAmount,
      gstRate,
      placeOfSupply,
      authorizedSignature,
      status 
    } = body;

    // Validate required fields
    if (!invoiceDate) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invoice Date is required." 
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
      if (!item.description) {
        return new Response(JSON.stringify({
          success: false,
          error: "Description is required for all items."
        }), { status: 400 });
      }
      if (!item.rate || item.rate <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Rate must be greater than 0 for all items."
        }), { status: 400 });
      }
      if (!item.quantity || item.quantity <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: "Quantity must be greater than 0 for all items."
        }), { status: 400 });
      }
    }

    // Verify organization exists and get organization code for invoice number generation
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { 
        businessDetails: true,
        governmentAgencyDetail: true,
        corporationDetail: true,
        csoDetail: true
      }
    });

    if (!org) {
      return new Response(JSON.stringify({
        success: false,
        error: "Organization not found."
      }), { status: 404 });
    }

    // Get organization code based on type
    let orgCode = 'ORG';
    switch (org.orgType) {
      case 'business':
        orgCode = org.businessDetails?.businessNameCode || 'ORG';
        break;
      case 'government':
        orgCode = org.governmentAgencyDetail?.agencyCode || 'ORG';
        break;
      case 'corporation':
        orgCode = org.corporationDetail?.organizationCode || 'ORG';
        break;
      case 'cso':
        orgCode = org.csoDetail?.agencyCode || 'ORG';
        break;
      default:
        orgCode = 'ORG';
    }

    // Generate invoice number
    let invoiceNo = generateInvoiceNumber(orgCode, new Date(invoiceDate));

    // Check if invoice number already exists (very unlikely but check anyway)
    let existingInvoice = await prisma.secondHandGoodsSalesInvoice.findUnique({
      where: { invoiceNo }
    });
    let attempts = 0;
    while (existingInvoice && attempts < 10) {
      // Regenerate if exists (extremely rare)
      invoiceNo = generateInvoiceNumber(orgCode, new Date(invoiceDate));
      existingInvoice = await prisma.secondHandGoodsSalesInvoice.findUnique({
        where: { invoiceNo }
      });
      attempts++;
    }

    // Calculate totals
    let totalAmount = 0;
    let calculatedExemptAmount = 0;
    const processedItems = items.map((item, index) => {
      const discount = parseFloat(item.discount) || 0;
      const saleAmount = (parseFloat(item.rate) * parseFloat(item.quantity)) - discount;
      totalAmount += saleAmount;
      
      // If item is exempt, add to exempt amount
      if (item.gstStatus === 'EXEMPT' || item.gstStatus === 'ZERO_RATED') {
        calculatedExemptAmount += saleAmount;
      }
      
      return {
        slNo: index + 1,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitId: item.unitId ? parseInt(item.unitId) : null,
        rate: parseFloat(item.rate),
        discount: discount,
        saleAmount: saleAmount,
        gstStatus: item.gstStatus || 'APPLICABLE',
        status: item.status || "A"
      };
    });

    const finalExemptAmount = exemptAmount !== undefined ? parseFloat(exemptAmount) : calculatedExemptAmount;
    const taxableAmount = totalAmount - finalExemptAmount;
    const finalGstRate = gstRate ? parseFloat(gstRate) : 0;
    const gstAmount = taxableAmount * (finalGstRate / 100);
    const totalInvoiceValue = totalAmount + gstAmount;
    const amountInWords = numberToWords(totalInvoiceValue);

    if (partyId) {
      const party = await prisma.party.findUnique({
        where: { partyId: parseInt(partyId) }
      });
      if (!party) {
        return new Response(JSON.stringify({
          success: false,
          error: "Party not found."
        }), { status: 404 });
      }
    }

    if (salesOrderId) {
      const so = await prisma.secondHandGoodsSales.findUnique({
        where: { salesOrderId: parseInt(salesOrderId) }
      });
      if (!so) {
        return new Response(JSON.stringify({
          success: false,
          error: "Sales Order not found."
        }), { status: 404 });
      }
    }

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
    for (const item of processedItems) {
      if (item.unitId) {
        const unit = await prisma.Unit.findUnique({
          where: { id: item.unitId }
        });
        if (!unit) {
          return new Response(JSON.stringify({
            success: false,
            error: `Unit not found for item: ${item.description}.`
          }), { status: 404 });
        }
      }
    }

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.secondHandGoodsSalesInvoice.create({
        data: {
          invoiceNo,
          invoiceDate: new Date(invoiceDate),
          isOriginal: isOriginal !== undefined ? isOriginal : true,
          salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
          organizationId: organizationId,
          partyId: partyId ? parseInt(partyId) : null,
          customerName: customerName || null,
          customerTPN: customerTPN || null,
          customerAddress: customerAddress || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          currencyId: currencyId ? parseInt(currencyId) : null,
          totalAmount: totalAmount,
          exemptAmount: finalExemptAmount,
          taxableAmount: taxableAmount,
          gstRate: finalGstRate,
          gstAmount: gstAmount,
          totalInvoiceValue: totalInvoiceValue,
          amountInWords: amountInWords,
          placeOfSupply: placeOfSupply || null,
          authorizedSignature: authorizedSignature || null,
          status: status || "A"
        }
      });

      // Create items
      await tx.secondHandGoodsSalesInvoiceItem.createMany({
        data: processedItems.map(item => ({
          ...item,
          invoiceId: inv.invoiceId
        }))
      });

      // Return invoice with items
      return await tx.secondHandGoodsSalesInvoice.findUnique({
        where: { invoiceId: inv.invoiceId },
        include: {
          organization: {
            include: {
              businessDetails: true
            }
          },
          party: {
            include: {
              businessParty: true,
              individualParty: true
            }
          },
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
      message: "Invoice created successfully",
      invoice
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

