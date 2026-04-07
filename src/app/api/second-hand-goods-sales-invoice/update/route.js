import prisma from "@/lib/prisma";
import { numberToWords } from "@/lib/invoiceNumberGenerator";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      id,
      invoiceDate,
      isOriginal,
      salesOrderId,
      organizationId,
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

    if (!id) {
      return Response.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Verify invoice exists
    const existingInvoice = await prisma.secondHandGoodsSalesInvoice.findUnique({
      where: { invoiceId: Number(id) }
    });

    if (!existingInvoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify relations if provided
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: parseInt(organizationId) }
      });
      if (!org) {
        return Response.json({
          error: "Organization not found."
        }, { status: 404 });
      }
    }

    if (partyId) {
      const party = await prisma.party.findUnique({
        where: { partyId: parseInt(partyId) }
      });
      if (!party) {
        return Response.json({
          error: "Party not found."
        }, { status: 404 });
      }
    }

    if (salesOrderId) {
      const so = await prisma.secondHandGoodsSales.findUnique({
        where: { salesOrderId: parseInt(salesOrderId) }
      });
      if (!so) {
        return Response.json({
          error: "Sales Order not found."
        }, { status: 404 });
      }
    }

    if (currencyId) {
      const currency = await prisma.Currency.findUnique({
        where: { currencyId: parseInt(currencyId) }
      });
      if (!currency) {
        return Response.json({
          error: "Currency not found."
        }, { status: 404 });
      }
    }

    // If items are provided, validate and calculate totals
    let totalAmount = existingInvoice.totalAmount;
    let finalExemptAmount = existingInvoice.exemptAmount;
    let taxableAmount = existingInvoice.taxableAmount;
    let gstAmount = existingInvoice.gstAmount;
    let totalInvoiceValue = existingInvoice.totalInvoiceValue;
    let amountInWords = existingInvoice.amountInWords;

    if (items && Array.isArray(items)) {
      // Validate items
      for (const item of items) {
        if (item.description && (!item.rate || item.rate <= 0)) {
          return Response.json({
            error: "Rate must be greater than 0 for all items."
          }, { status: 400 });
        }
        if (item.description && (!item.quantity || item.quantity <= 0)) {
          return Response.json({
            error: "Quantity must be greater than 0 for all items."
          }, { status: 400 });
        }
        if (item.unitId) {
          const unit = await prisma.Unit.findUnique({
            where: { id: parseInt(item.unitId) }
          });
          if (!unit) {
            return Response.json({
              error: `Unit not found for item: ${item.description || 'unknown'}.`
            }, { status: 404 });
          }
        }
      }

      // Calculate totals
      totalAmount = 0;
      let calculatedExemptAmount = 0;
      items.forEach((item) => {
        if (item.description) {
          const discount = parseFloat(item.discount) || 0;
          const saleAmount = (parseFloat(item.rate) * parseFloat(item.quantity)) - discount;
          totalAmount += saleAmount;
          
          if (item.gstStatus === 'EXEMPT' || item.gstStatus === 'ZERO_RATED') {
            calculatedExemptAmount += saleAmount;
          }
        }
      });

      finalExemptAmount = exemptAmount !== undefined ? parseFloat(exemptAmount) : calculatedExemptAmount;
      taxableAmount = totalAmount - finalExemptAmount;
      const finalGstRate = gstRate !== undefined ? parseFloat(gstRate) : existingInvoice.gstRate || 0;
      gstAmount = taxableAmount * (finalGstRate / 100);
      totalInvoiceValue = totalAmount + gstAmount;
      amountInWords = numberToWords(totalInvoiceValue);
    } else if (exemptAmount !== undefined || gstRate !== undefined) {
      // Recalculate if exempt amount or GST rate changed
      finalExemptAmount = exemptAmount !== undefined ? parseFloat(exemptAmount) : existingInvoice.exemptAmount;
      taxableAmount = totalAmount - finalExemptAmount;
      const finalGstRate = gstRate !== undefined ? parseFloat(gstRate) : existingInvoice.gstRate || 0;
      gstAmount = taxableAmount * (finalGstRate / 100);
      totalInvoiceValue = totalAmount + gstAmount;
      amountInWords = numberToWords(totalInvoiceValue);
    }

    // Update invoice and items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Update invoice header
      const updateData = {};
      if (invoiceDate) updateData.invoiceDate = new Date(invoiceDate);
      if (isOriginal !== undefined) updateData.isOriginal = isOriginal;
      if (salesOrderId !== undefined) updateData.salesOrderId = salesOrderId ? parseInt(salesOrderId) : null;
      if (organizationId !== undefined) updateData.organizationId = organizationId ? parseInt(organizationId) : null;
      if (partyId !== undefined) updateData.partyId = partyId ? parseInt(partyId) : null;
      if (customerName !== undefined) updateData.customerName = customerName || null;
      if (customerTPN !== undefined) updateData.customerTPN = customerTPN || null;
      if (customerAddress !== undefined) updateData.customerAddress = customerAddress || null;
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail || null;
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone || null;
      if (currencyId !== undefined) updateData.currencyId = currencyId ? parseInt(currencyId) : null;
      if (placeOfSupply !== undefined) updateData.placeOfSupply = placeOfSupply || null;
      if (authorizedSignature !== undefined) updateData.authorizedSignature = authorizedSignature || null;
      if (status) updateData.status = status;
      
      // Update calculated fields
      updateData.totalAmount = totalAmount;
      updateData.exemptAmount = finalExemptAmount;
      updateData.taxableAmount = taxableAmount;
      if (gstRate !== undefined) updateData.gstRate = parseFloat(gstRate);
      updateData.gstAmount = gstAmount;
      updateData.totalInvoiceValue = totalInvoiceValue;
      updateData.amountInWords = amountInWords;

      const updatedInvoice = await tx.secondHandGoodsSalesInvoice.update({
        where: { invoiceId: Number(id) },
        data: updateData
      });

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Soft delete all existing items
        await tx.secondHandGoodsSalesInvoiceItem.updateMany({
          where: { invoiceId: Number(id) },
          data: { status: "D" }
        });

        // Create new items
        const newItems = items
          .filter(item => item.description)
          .map((item, index) => {
            const discount = parseFloat(item.discount) || 0;
            const saleAmount = (parseFloat(item.rate) * parseFloat(item.quantity)) - discount;
            return {
              invoiceId: Number(id),
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

        if (newItems.length > 0) {
          await tx.secondHandGoodsSalesInvoiceItem.createMany({
            data: newItems
          });
        }
      }

      // Return updated invoice with items
      return await tx.secondHandGoodsSalesInvoice.findUnique({
        where: { invoiceId: Number(id) },
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
            where: { status: { not: "D" } },
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

    return Response.json({ success: true, invoice });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

