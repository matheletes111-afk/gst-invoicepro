import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const salesId = Number(params.sales_id);
    const parseAddressFromJson = (json) => {
      try {
        if (!json) return ''

        const data = typeof json === 'string' ? JSON.parse(json) : json

        const parts = [
          data.flatNo && `Flat: ${data.flatNo}.`,
          data.buildingNo && `Building: ${data.buildingNo}.`,
          data.locality && `Locality: ${data.locality}.`,
          data.wardName && `Street: ${data.wardName}.`,
          data.village && `Village: ${data.village}.`,
          data.gewog && `Gewog: ${data.gewog}.`,
          data.dzongkhag && `Dzongkhag: ${data.dzongkhag}.`
        ]

        return parts.filter(Boolean).join(', ')
      } catch (error) {
        console.error('Invalid address JSON:', error)
        return ''
      }
    }


    const originalInvoice = await prisma.gstInvoiceOriginal.findFirst({
      where: { sales_id: salesId },
    });

    if (!originalInvoice) {
      return NextResponse.json(
        { message: "Original invoice not found" },
        { status: 404 }
      );
    }


    const invoiceCopy = await prisma.tbl_invoice_copy.create({
      data: {
        gst_invoice_id: Number(originalInvoice.gst_invoice_id),
        organization_id: originalInvoice.organization_id,
        sales_id: Number(originalInvoice.sales_id),
        customer_id: Number(originalInvoice.customer_id),

        gst_invoice_date: originalInvoice.gst_invoice_date,

        total_sales_amount: originalInvoice.total_sales_amount,
        total_exempt_amount: originalInvoice.total_exempt_amount,
        total_taxable_amount: originalInvoice.total_taxable_amount,
        total_gst_amount: originalInvoice.total_gst_amount,
        total_invoice_amount: originalInvoice.total_invoice_amount,

        gst_invoice_no: originalInvoice.gst_invoice_no ?? "",

        duplicate_issue_date: new Date(),

        created_by: originalInvoice.created_by,
        created_on: originalInvoice.created_at,
      }
    });






    /* ---------------- SALES ---------------- */
    const salesResult = await prisma.$queryRaw`
  SELECT 
    s.sales_id,
    s.organization_id,
    s.customer_id,
    s.currency,
    c.currencyName,
    c.currencySymbol,
    s.customer_tpn,
    s.customer_name,
    s.sales_date,
    s.sales_amount,
    s.exempt_amount,
    s.taxable_amount,
    s.sales_invoice_no,
    s.gst_amount,
    s.total_invoice_amount,
    s.status,
    s.created_by,
    s.created_on,
    s.payment_mode,
    s.transaction_id,
    s.journal_number,
    s.cheque_number,
    s.bank_name

  FROM tbl_sales AS s
  LEFT JOIN Currency AS c ON s.currency = c.currencyId
  WHERE s.sales_id = ${salesId}
  LIMIT 1
`;

    if (!salesResult.length) {
      return NextResponse.json({ message: "Sales not found" }, { status: 404 });
    }

    const sales = salesResult[0];

    /* ---------------- PARTY ---------------- */
    const partyResult = await prisma.$queryRaw`
      SELECT *
      FROM Party
      WHERE partyId = ${sales.customer_id}
      LIMIT 1
    `;

    if (!partyResult.length) {
      return NextResponse.json({ message: "Party not found" }, { status: 404 });
    }

    const party = partyResult[0];

    /* ---------------- PARTY DETAILS BY TYPE ---------------- */
    let partyDetails = {};
    let partyDisplayName = "";
    let partyEmail = "";
    let partyPhone = "";
    let partyAddress = "";
    let partyRegistrationNo = "";

    switch (party.partyType) {
      case "BUSINESS":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM BusinessParty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.businessName || sales.customer_name || "Business";
        partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
        partyEmail = partyDetails?.officeEmail || "";
        partyPhone = partyDetails?.officePhone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "GOVERNMENT_AGENCY":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM GovernmentAgencyParty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.agencyName || "Government Agency";
        partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
        partyEmail = partyDetails?.officeEmail || "";
        partyPhone = partyDetails?.officePhone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "CORPORATION":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM CorporationParty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.corporationName || sales.customer_name || "Corporation";
        partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
        partyEmail = partyDetails?.officeEmail || "";
        partyPhone = partyDetails?.officePhone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "CSO":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM CSOParty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.csoName || sales.customer_name || "CSO";
        partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
        partyEmail = partyDetails?.officeEmail || "";
        partyPhone = partyDetails?.officePhone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "INDIVIDUAL":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM IndividualParty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = sales.customer_name || "Individual";
        partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;
    }

    /* ---------------- ORGANIZATION ---------------- */
    const orgResult = await prisma.$queryRaw`
      SELECT *
      FROM Organization
      WHERE id = ${sales.organization_id}
      LIMIT 1
    `;

    if (!orgResult.length) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    const org = orgResult[0];

    /* ---------------- ORGANIZATION DETAILS ---------------- */
    let orgDetails = {};
    let orgName = "";
    let orgCode = "";
    let orgAddress = "";
    let orgPhone = "";
    let orgEmail = ''

    switch (org.orgType) {

      //  BUSINESS
      case 'business':
        orgDetails = (
          await prisma.$queryRaw`
        SELECT * FROM BusinessDetails
        WHERE organizationId = ${org.id}
        LIMIT 1
      `
        )[0]

        orgName = orgDetails?.businessName || ''
        // orgCode = orgDetails?.businessNameCode || ''
          orgCode = orgDetails?.taxpayerNumber || ''
        orgAddress = parseAddressFromJson(orgDetails?.businessLocationJson)
        orgPhone = orgDetails?.officePhone || ''
        orgEmail = orgDetails?.officeEmail || ''

        break

      //  GOVERNMENT AGENCY
      case 'government':
        orgDetails = (
          await prisma.$queryRaw`
        SELECT * FROM GovernmentAgencyDetails
        WHERE organizationId = ${org.id}
        LIMIT 1
      `
        )[0]

        orgName = orgDetails?.agencyName || ''
        // orgCode = orgDetails?.agencyCode || ''
         orgCode = orgDetails?.tpn || ''
        orgAddress = orgDetails?.taxpayerRegistrationRegion || ''
        orgPhone = orgDetails?.contactPhone || ''
        orgEmail = orgDetails?.contactEmail || ''

        break

      //  CORPORATION
      case 'corporation':
        orgDetails = (
          await prisma.$queryRaw`
        SELECT * FROM CorporationDetails
        WHERE organizationId = ${org.id}
        LIMIT 1
      `
        )[0]

        orgName = orgDetails?.corporationName || ''
        // orgCode = orgDetails?.organizationCode || ''
         orgCode = orgDetails?.tpn || ''
        orgAddress = orgDetails?.taxpayerRegistrationRegion || ''
        orgPhone = orgDetails?.contactPhone || ''
        orgEmail = orgDetails?.contactEmail || ''

        break

      //  CSO
      case 'cso':
        orgDetails = (
          await prisma.$queryRaw`
        SELECT * FROM CsoDetails
        WHERE organizationId = ${org.id}
        LIMIT 1
      `
        )[0]

        orgName = orgDetails?.agencyName || ''
        // orgCode = orgDetails?.agencyCode || ''
         orgCode = orgDetails?.tpn || ''
        orgAddress = orgDetails?.taxpayerRegistrationRegion || ''
        orgPhone = orgDetails?.contactPhone || ''

        break
    }

    /* ---------------- SALES ITEMS ---------------- */
    const saleItems = await prisma.$queryRaw`
  SELECT
    si.sales_item_id,
    si.sales_id,
    si.sales_item_type,
    si.goods_service_name,
    si.goods_service_description,
    si.unit_price,
    si.quantity,
    si.amount,
    si.unit_of_measurement_id,
    u.name,
    si.discount,
    si.amount_after_discount,
    si.gst_percentage,
    si.gst_amount,
    si.goods_service_total_amount
  FROM tbl_sales_items AS si
  LEFT JOIN Unit AS u
      ON u.id = si.unit_of_measurement_id
      WHERE si.sales_id = ${sales.sales_id}
    `;


    // Get GST percentage from first item or default to 5%
    const gstPercentage = saleItems.length > 0 ? saleItems[0]?.gst_percentage || 5 : 5;

    /* ---------------- GENERATE HTML ---------------- */
    const html = generateInvoiceHTML({
      salesId: salesId,
      sales,
      items: saleItems,
      party: {
        name: partyDisplayName,
        tpn: partyRegistrationNo,
        address: partyAddress,
        email: partyEmail,
        phone: partyPhone
      },
      organization: {
        name: orgName,
        tpn: orgCode,
        address: orgAddress,
        phone: orgPhone,
        email: orgEmail
      },
      gstPercentage: gstPercentage
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${sales.sales_invoice_no || salesId}.html"`
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(data) {
  const { salesId, sales, items, party, organization, gstPercentage } = data;

  // Format date function (DD-MMM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '30-Oct-2025';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return '30-Oct-2025';
    }
  };

  // Format date for QR code (YYYY-MM-DD)
  const formatDateForQR = (dateString) => {
    if (!dateString) return '2025-10-30';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '2025-10-30';
    }
  };

  // Format currency function
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return parseFloat(amount).toFixed(2);
  };

  // Number to words function
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const number = parseFloat(num) || 0;
    const wholeNumber = Math.floor(number);

    if (wholeNumber === 0) return 'Zero';

    let words = '';

    // Handle thousands
    if (wholeNumber >= 1000) {
      const thousands = Math.floor(wholeNumber / 1000);
      words += numberToWords(thousands) + ' Thousand';
      const remainder = wholeNumber % 1000;
      if (remainder > 0) {
        words += ' ' + numberToWords(remainder);
      }
      return words.trim();
    }

    // Handle hundreds
    if (wholeNumber >= 100) {
      words += ones[Math.floor(wholeNumber / 100)] + ' Hundred';
      const remainder = wholeNumber % 100;
      if (remainder > 0) {
        words += ' ' + numberToWords(remainder);
      }
      return words.trim();
    }

    // Handle tens
    if (wholeNumber >= 20) {
      words += tens[Math.floor(wholeNumber / 10)];
      const remainder = wholeNumber % 10;
      if (remainder > 0) {
        words += ' ' + ones[remainder];
      }
      return words.trim();
    }

    // Handle teens
    if (wholeNumber >= 10) {
      return teens[wholeNumber - 10];
    }

    // Handle ones
    return ones[wholeNumber];
  };

  // Generate verification URL for QR code
  const generateVerificationUrl = (invoiceNo) => {
    if (!invoiceNo) return 'https://gst.drcs.bt/verify/INV2025001';
    const cleanInvoiceNo = invoiceNo.replace(/\//g, '');
    return `https://gst.drcs.bt/verify/${cleanInvoiceNo}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    if (!currencyCode) return 'Nu.';
    switch (currencyCode.toString()) {
      case '1': return 'Nu.';
      case '2': return '₹';
      case '3': return '$';
      default: return 'Nu.';
    }
  };

  // QR Data for the QR code
  // const qrData = {
  //   "invoiceNo": sales.sales_invoice_no || 'INV/2025/001',
  //   "invoiceDate": formatDateForQR(sales.sales_date),
  //   "supplierTpn": organization.tpn || '101234567',
  //   "totalAmount": formatCurrency(sales.total_invoice_amount),
  //   "verificationUrl": generateVerificationUrl(sales.sales_invoice_no),
  //   "invoiceType": "original",
  //   "issuedBy": "purchaser",
  //   "goodType": "New Goods / Services"
  // };

  const currencySymbol = getCurrencySymbol(sales.currency);
  // const qrDataString = JSON.stringify(qrData);

return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
  <title>Performa Invoice - ${sales.sales_invoice_no || 'INV/2025/001'}</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      font-size: 14px;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      min-height: 100vh;
    }

    h1 {
      text-align: center;
      margin-bottom: 0;
      font-size: 24px;
    }

    .sub-title {
      text-align: center;
      font-size: 16px;
      margin-top: 5px;
      font-weight: bold;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }

    .label-bold {
      font-weight: bold;
    }

    .supplier-block, .customer-block {
      line-height: 1.6;
      margin-top: 10px;
    }

    .qr-block {
      text-align: center;
    }

    .qr-block div {
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .qr-label {
      font-size: 10px;
      color: #666;
      margin-top: 3px;
    }

    .currency {
      margin: 20px 0 10px 0;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table th, table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: center;
    }

    table th {
      font-weight: bold;
    }

    .totals {
      margin-top: 20px;
      line-height: 1.6;
    }

    .totals div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .totals span {
      display: inline-block;
      width: 200px;
    }

    .invoice-value {
      margin-top: 15px;
      font-size: 15px;
      font-weight: bold;
      text-align: right;
    }

    .words {
      margin-top: 5px;
      font-style: italic;
    }

    .declaration {
      margin-top: 20px;
      line-height: 1.6;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
    }
    
    /* Invoice Container */
    .invoice-container {
      width: 794px;
      min-height: 1123px;
      background: white;
      padding: 70px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    
    /* Print and Download Buttons */
    .button-container {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      width: 794px;
      position: relative;
    }
    
    .print-options-button {
      padding: 10px 20px;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
      text-decoration: none;
      display: inline-block;
      position: relative;
    }
    
    .print-options-dropdown {
      display: none;
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 150px;
      z-index: 1000;
    }
    
    .print-options-dropdown.show {
      display: block;
    }
    
    .print-option-item {
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #333;
    }
    
    .print-option-item:last-child {
      border-bottom: none;
    }
    
    .print-option-item:hover {
      background-color: #f5f5f5;
    }
    
    .pdf-button {
      padding: 10px 20px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      text-decoration: none;
      display: inline-block;
    }
    
    .close-button {
      padding: 10px 20px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
      text-decoration: none;
      display: inline-block;
    }
    
    /* Print media queries */
    @media print {
      body {
        margin: 20px;
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        padding: 20px;
        width: 100%;
        min-height: auto;
      }
      
      .button-container {
        display: none;
      }
      
      .print-options-dropdown {
        display: none !important;
      }
    }
    
    /* A5 format specific styles */
    /* A5 format specific styles - IMPROVED WITH BETTER FONT SIZE AND MARGINS */
.a5-format-mode .invoice-container {
  width: 148mm !important;
  height: 105mm !important;
  padding: 3mm 2mm !important; /* Reduced padding from 5mm to 3mm top/bottom, 2mm left/right */
  font-size: 9px !important; /* Increased from 8px */
  box-shadow: none !important;
  margin: 0 !important;
  position: relative;
  overflow: visible !important; /* Changed from hidden */
  line-height: 1.3 !important; /* Increased from 1.2 */
}

.a5-format-mode h1 {
  font-size: 14px !important; /* Increased from 12px */
  line-height: 1.3 !important;
  border-top: 1px solid black !important;
  border-bottom: 1px solid black !important;
  padding: 3px 0 !important; /* Increased padding */
  margin-bottom: 4px !important; /* Reduced margin */
  text-align: center !important;
  margin-top: 0 !important;
}

.a5-format-mode .sub-title {
  font-size: 10px !important; /* Increased from 9px */
  margin-bottom: 6px !important;
  font-weight: 800 !important;
}

/* A5 Layout: Invoice No and Date on same line - MORE COMPACT */
.a5-format-mode .invoice-header-row {
  display: flex !important;
  justify-content: space-between !important;
  margin-bottom: 5px !important;
  font-size: 8px !important; /* Increased from 7px */
  padding: 0 1mm !important; /* Reduced horizontal padding */
}

/* A5 Layout: Supplier and Customer side by side - ADJUSTED MARGINS */
.a5-format-mode .details-container {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  gap: 6px !important; /* Reduced gap from 8px */
  margin-bottom: 5px !important; /* Reduced from 6px */
  padding: 0 !important;
}

.a5-format-mode .details-left-column {
  flex: 1 !important;
  display: flex !important;
  gap: 4px !important; /* Reduced gap from 6px */
  min-width: 0 !important;
}

.a5-format-mode .supplier-column,
.a5-format-mode .customer-column {
  flex: 1 !important;
  min-width: 0 !important;
  padding: 0 !important;
}

.a5-format-mode .supplier-block,
.a5-format-mode .customer-block {
  font-size: 8px !important; /* Increased from 7px */
  line-height: 1.4 !important; /* Increased from 1.3 */
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  margin: 0 !important;
  padding: 2px !important; /* Reduced from 3px */
  border: 0.5px solid #ddd !important; /* Lighter border */
  border-radius: 2px !important;
  height: auto !important;
  max-height: none !important;
  min-height: 35px !important; /* Ensure minimum height */
}

.a5-format-mode .details-right-column {
  flex-shrink: 0 !important;
  text-align: center !important;
  padding-left: 1mm !important;
  padding-right: 0 !important;
  width: 22mm !important; /* Reduced to fit within margins */
  max-width: 22mm !important;
  overflow: hidden !important;
}

.a5-format-mode .qr-block {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 22mm !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.a5-format-mode .qr-block div {
  width: 18mm !important; /* Use mm for better control */
  height: 18mm !important;
  max-width: 18mm !important;
  max-height: 18mm !important;
  margin: 0 auto !important;
  padding: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.a5-format-mode .qr-label {
  font-size: 5px !important;
  margin-top: 1px !important;
  white-space: nowrap !important;
  width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.a5-format-mode .label-bold {
  font-weight: 800 !important;
  font-size: 8px !important; /* Increased from 7px */
  min-width: 25px !important;
}

.a5-format-mode .currency,
.a5-format-mode .payment {
  font-size: 8px !important; /* Increased from 7px */
  margin: 3px 0 !important; /* Reduced from 4px */
  padding: 2px 0 !important;
  border-top: 0.5px solid #ddd !important;
  border-bottom: 0.5px solid #ddd !important;
  text-align: center !important;
}

.a5-format-mode table {
  font-size: 7px !important; /* Increased from 6.5px */
  margin-top: 4px !important; /* Reduced from 5px */
  margin-bottom: 4px !important; /* Reduced from 5px */
  table-layout: fixed !important;
  border-collapse: collapse !important;
  width: 100% !important;
}

.a5-format-mode th, .a5-format-mode td {
  padding: 2px 1px !important; /* Reduced padding */
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  border: 1px solid #000 !important;
  line-height: 1.2 !important; /* Increased from 1.1 */
  font-size: 7px !important;
}

/* Adjust column widths for A5 - MORE BALANCED */
.a5-format-mode table th:nth-child(1),
.a5-format-mode table td:nth-child(1) {
  width: 5% !important; /* Reduced from 6% */
}

.a5-format-mode table th:nth-child(2),
.a5-format-mode table td:nth-child(2) {
  width: 25% !important; /* Reduced from 28% */
}

.a5-format-mode table th:nth-child(3),
.a5-format-mode table td:nth-child(3) {
  width: 8% !important;
}

.a5-format-mode table th:nth-child(4),
.a5-format-mode table td:nth-child(4) {
  width: 8% !important;
}

.a5-format-mode table th:nth-child(5),
.a5-format-mode table td:nth-child(5) {
  width: 12% !important;
}

.a5-format-mode table th:nth-child(6),
.a5-format-mode table td:nth-child(6) {
  width: 12% !important;
}

.a5-format-mode table th:nth-child(7),
.a5-format-mode table td:nth-child(7) {
  width: 15% !important; /* Increased from 12% */
}

.a5-format-mode .totals {
  margin-top: 5px !important; /* Reduced from 6px */
  font-size: 8px !important; /* Increased from 7px */
  line-height: 1.4 !important; /* Increased from 1.3 */
}

.a5-format-mode .totals div {
  margin-bottom: 2px !important;
  display: flex !important;
  justify-content: space-between !important;
}

.a5-format-mode .totals span {
  width: 75px !important; /* Increased from 70px */
  font-size: 8px !important;
}

.a5-format-mode .invoice-value {
  font-size: 9px !important; /* Increased from 8px */
  margin-top: 5px !important; /* Reduced from 6px */
  margin-bottom: 3px !important; /* Reduced from 4px */
  padding-top: 2px !important;
  border-top: 0.5px solid #000 !important;
  text-align: right !important;
  font-weight: 800 !important;
}

.a5-format-mode .words {
  font-size: 7px !important; /* Increased from 6.5px */
  white-space: normal !important;
  overflow: visible !important;
  margin-top: 3px !important; /* Reduced from 4px */
  margin-bottom: 3px !important; /* Reduced from 4px */
  line-height: 1.3 !important; /* Increased from 1.2 */
  max-height: none !important;
  font-style: italic !important;
}

.a5-format-mode .declaration {
  font-size: 7px !important; /* Increased from 6.5px */
  white-space: normal !important;
  overflow: visible !important;
  margin-top: 5px !important; /* Reduced from 6px */
  line-height: 1.3 !important; /* Increased from 1.2 */
  padding-top: 3px !important;
  border-top: 0.5px solid #ddd !important;
}

.a5-format-mode .declaration div {
  margin-bottom: 2px !important;
}

/* Remove extra white space */
.a5-format-mode .invoice-container::after {
  content: '';
  display: block;
  height: 0 !important;
}

/* Ensure QR fits properly within the right column */
.a5-format-mode .qr-block svg {
  max-width: 18mm !important;
  max-height: 18mm !important;
  width: 18mm !important;
  height: 18mm !important;
  display: block !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

/* Adjust top-row for A5 to be more compact */
.a5-format-mode .top-row {
  display: flex !important;
  justify-content: space-between !important;
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  font-size: 8px !important;
  padding: 0 1mm !important;
}

/* Customer block adjustment for A5 */
.a5-format-mode .customer-block {
  margin-top: 0 !important;
}
  </style>
</head>

<body>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>

  <div class="invoice-container" id="invoice-content">
    <h1 style="border-top: 2px solid black; border-bottom: 2px solid black; line-height: 57px;">Performa Invoice</h1>
   

    <!-- Invoice No + Date -->
    <div class="top-row">
      <div>
        <span class="label-bold">Invoice No.:</span>
        ${sales.sales_invoice_no || 'INV/2025/001'}
      </div>

      <div>
        <span class="label-bold">Invoice Date:</span>
        ${formatDate(sales.sales_date)}
      </div>
      <div>
        <span class="label-bold">Issue Date:</span>
        ${formatDate(new Date())}
      </div>
    </div>

    <!-- Supplier + QR -->
    <div class="top-row">
      <div class="supplier-block">
        ${organization?.name ? `<span class="label-bold">Supplier Name:</span> ${organization.name}<br>` : ''}
        ${organization?.tpn ? `<span class="label-bold">TPN:</span> ${organization.tpn}<br>` : ''}
        ${organization?.address ? `<span class="label-bold">Address:</span> ${organization.address}<br>` : ''}
        ${organization?.email ? `<span class="label-bold">Email:</span> ${organization.email}<br>` : ''}
        ${organization?.phone ? `<span class="label-bold">Phone:</span> ${organization.phone}<br>` : ''}
      </div>

      <div class="qr-block">
        <div id="qrcode"></div>
        <div class="qr-label"></div>
      </div>
    </div>

    <!-- Customer -->
    <div class="customer-block" style="margin-top:-80px;">
      ${party?.name ? `<span class="label-bold">Customer Name:</span> ${party.name}<br>` : ''}
      ${party?.address ? `<span class="label-bold">Address:</span> ${party.address}<br>` : ''}
      ${party?.email ? `<span class="label-bold">Email:</span> ${party.email}<br>` : ''}
      ${party?.phone ? `<span class="label-bold">Phone:</span> ${party.phone}<br>` : ''}
    </div>

    <div class="currency">Currency: ${sales.currencyName}</div>
    <div class="payment">
      Payment Mode: ${
        sales.payment_mode
          ? sales.payment_mode === 'CASH'
            ? 'Cash'
            : sales.payment_mode === 'PAYMENT_GATEWAY'
            ? `Payment Gateway (Txn ID: ${sales.transaction_id || 'N/A'})`
            : ['MBOB', 'MPAY', 'TPAY', 'DRUKPAY', 'EPAY', 'DK_BANK'].includes(sales.payment_mode)
            ? `${sales.payment_mode} (Journal No: ${sales.journal_number || 'N/A'})`
            : sales.payment_mode === 'CHEQUE'
            ? `Cheque (No: ${sales.cheque_number || 'N/A'}, Bank: ${sales.bank_name ? sales.bank_name.replace(/_/g, ' ') : 'N/A'})`
            : 'N/A'
          : 'N/A'
      }
    </div>

    <br>

    <!-- ITEMS TABLE -->
    <table>
      <thead>
        <tr>
          <th>Sl.No.</th>
                        <th>Desc</th>
                        <th>Qty</th>
                        <th>U</th>
                        <th>Rate</th>
                        <th>Disc</th>
                        <th>Sale Amount</th>
        </tr>
      </thead>

      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
                        <td>${item.goods_service_name || ''}</td>
                        <td class="text-center">${item.quantity || ''}</td>
                        <td class="text-center">${item.name}</td>
                        <td class="text-right">${formatCurrency(item.unit_price)}</td>
                        <td class="text-right">${formatCurrency(item.discount)}</td>
                        <td class="text-right">${formatCurrency(item.amount_after_discount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals">
      <div><span>Total Amount</span> ${formatCurrency(sales.sales_amount)}</div>
      <div><span>Exempt Amount</span> ${formatCurrency(sales.exempt_amount)}</div>
      <div><span>Taxable Amount</span> ${formatCurrency(sales.taxable_amount)}</div>
      <div><span>GST@5%</span> ${formatCurrency(sales.gst_amount)}</div>
    </div>

    <div class="invoice-value">
      Total Invoice Value: ${formatCurrency(sales.total_invoice_amount)}
    </div>

    <div class="words">
      Amount in Words: ${numberToWords(sales.total_invoice_amount)} ${sales.currencyName} Only
    </div>

    <!-- DECLARATION -->
    <div class="declaration">
      <div>Declaration: I/We certify that the particulars are true.</div>
      <div>Authorized Signature: _____________________</div>
      <div>Place of Supply:  ${organization.address || 'Norzhi Lam, Thimphu, '} Bhutan</div>
    </div>

    <!-- QR CODE FOR BILL FORMAT (Hidden by default) -->
    <div class="qr-block-bottom" id="qrcode-bottom" style="display: none;">
      <div id="qrcode-bottom-content"></div>
      <div class="qr-label">Scan to verify invoice</div>
    </div>
  </div>

  <!-- Loader overlay for Bill PDF generation -->
  <div id="bill-pdf-loader" style="display:none; position:fixed; inset:0; background:rgba(255,255,255,0.9); z-index:9999; align-items:center; justify-content:center; flex-direction:column; gap:12px;">
    <div style="width:48px; height:48px; border:4px solid #e0e0e0; border-top-color:#2196f3; border-radius:50%; animation: bill-pdf-spin 0.8s linear infinite;"></div>
    <span style="font-size:16px; color:#333;">Generating Bill PDF...</span>
  </div>
  <style>@keyframes bill-pdf-spin { to { transform: rotate(360deg); } }</style>

  <!-- Action Buttons Below Invoice -->
  <div class="button-container">
    <div style="position: relative;">
      <button class="print-options-button" id="printOptionsBtn">
        🖨️ Print Options
      </button>
      <div class="print-options-dropdown" id="printOptionsDropdown">
        <div class="print-option-item" data-format="A4">A4</div>
        <div class="print-option-item" data-format="A5">A5</div>
        <div class="print-option-item" data-format="Bill">Bill Format</div>
      </div>
    </div>
    <button class="pdf-button" id="pdfDownloadBtn">
      📥 Download PDF
    </button>
    <a href="/sales" class="close-button">
      ❌ Close
    </a>
  </div>

  <script>
  window.__BILL_DATA__ = ${JSON.stringify({
    title: 'Performa Invoice',
    subtitle: '',
    invoiceNo: sales.sales_invoice_no || 'INV/2025/001',
    invoiceDate: formatDate(sales.sales_date),
    supplierName: organization?.name || '',
    supplierTpn: organization?.tpn || '',
    supplierAddress: organization?.address || '',
    supplierPhone: organization?.phone || '',
    customerName: party?.name || '',
    customerEmail: party?.email || '',
    customerPhone: party?.phone || '',
    customerAddress: party?.address || '',
    currency: sales.currencyName || '',
    paymentMode: !sales.payment_mode ? 'N/A' : sales.payment_mode === 'CASH' ? 'Cash' : sales.payment_mode === 'PAYMENT_GATEWAY' ? ('Payment Gateway (Txn ID: ' + (sales.transaction_id || 'N/A') + ')') : ['MBOB','MPAY','TPAY','DRUKPAY','EPAY','DK_BANK'].includes(sales.payment_mode) ? (sales.payment_mode + ' (Journal No: ' + (sales.journal_number || 'N/A') + ')') : sales.payment_mode === 'CHEQUE' ? ('Cheque (No: ' + (sales.cheque_number || 'N/A') + ', Bank: ' + (sales.bank_name ? String(sales.bank_name).replace(/_/g, ' ') : 'N/A') + ')') : 'N/A',
    items: items.map((item, i) => ({ sl: i + 1, desc: item.goods_service_name || '', qty: item.quantity || '', u: item.name || '', rate: formatCurrency(item.unit_price), disc: formatCurrency(item.discount), saleAmount: formatCurrency(item.amount_after_discount) })),
    totalAmount: formatCurrency(sales.sales_amount),
    exemptAmount: formatCurrency(sales.exempt_amount),
    taxableAmount: formatCurrency(sales.taxable_amount),
    gstAmount: formatCurrency(sales.gst_amount),
    totalInvoiceValue: formatCurrency(sales.total_invoice_amount),
    amountInWords: numberToWords(sales.total_invoice_amount) + ' ' + (sales.currencyName || '') + ' Only',
    placeOfSupply: (organization?.address || 'Norzhi Lam, Thimphu, ') + ' Bhutan'
  })};
  </script>
  <!-- QR Code Library -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
  <!-- PDF Generation Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
const qrText = [
  'invoiceNo: ${sales.sales_invoice_no}',
  'invoiceDate: ${formatDateForQR(sales.sales_date)}',
  'invoiceType: Performa',
  'issuedBy: ${organization.name}',
  'supplierTpn: ${organization.tpn}',
  'goodType: New Goods / Services',
  'verificationUrl: ',
  'amount: ${sales.total_invoice_amount}'
].join('\\n');

    // Function to generate QR code
    function generateQRCode(elementId, size) {
      const qrcodeElement = document.getElementById(elementId);
  qrcodeElement.innerHTML = '';
  
  try {
    let qrcode = new QRCode({
      content: qrText,
      padding: 2,
          width: size,
          height: size,
      color: "#000000",
      background: "#ffffff",
      ecl: "M"
    });
    
    qrcodeElement.innerHTML = qrcode.svg();
        
        const svg = qrcodeElement.querySelector('svg');
        if (svg) {
          svg.style.border = 'none';
          svg.style.background = '#fff';
          svg.style.width = size + 'px';
          svg.style.height = size + 'px';
          svg.style.display = 'block';
          svg.style.margin = '0 auto';
        }
  } catch (error) {
        console.error('QR code generation error:', error);
    try {
      const qrcode = new QRCode({
        content: qrText,
        padding: 2,
            width: size,
            height: size,
        color: "#000000",
        background: "#ffffff",
        ecl: "L"
      });
      
      qrcodeElement.innerHTML = qrcode.svg();
          
          const svg = qrcodeElement.querySelector('svg');
          if (svg) {
            svg.style.border = 'none';
            svg.style.background = '#fff';
            svg.style.width = size + 'px';
            svg.style.height = size + 'px';
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
          }
    } catch (fallbackError) {
          console.error('QR code fallback error:', fallbackError);
          qrcodeElement.innerHTML = '<div style="color: red; font-size: 10px; padding: ' + (size/2 - 10) + 'px 10px;">QR Error</div>';
        }
      }
    }

    // Function to rearrange layout for A5 format
    function setupA5Layout() {
      const invoiceContainer = document.getElementById('invoice-content');
      const detailsSection = invoiceContainer.querySelector('.top-row')?.parentElement;
      
      if (invoiceContainer.classList.contains('a5-format-mode')) {
        // Get elements
        const topRow = invoiceContainer.querySelector('.top-row');
        const customerBlock = invoiceContainer.querySelector('.customer-block');
        
        if (topRow && customerBlock) {
          // Remove negative margin from customer block
          customerBlock.style.marginTop = '0';
          
          // Create new layout container
          const detailsContainer = document.createElement('div');
          detailsContainer.className = 'details-container';
          
          // Create left column container
          const leftColumn = document.createElement('div');
          leftColumn.className = 'details-left-column';
          
          // Get supplier and customer blocks
          const supplierBlock = topRow.querySelector('.supplier-block');
          const qrBlock = topRow.querySelector('.qr-block');
          
          if (supplierBlock) {
            // Create supplier column
            const supplierColumn = document.createElement('div');
            supplierColumn.className = 'supplier-column';
            supplierColumn.appendChild(supplierBlock.cloneNode(true));
            
            // Create customer column
            const customerColumn = document.createElement('div');
            customerColumn.className = 'customer-column';
            customerColumn.appendChild(customerBlock.cloneNode(true));
            
            // Add columns to left container
            leftColumn.appendChild(supplierColumn);
            leftColumn.appendChild(customerColumn);
            
            // Create right column for QR
            const rightColumn = document.createElement('div');
            rightColumn.className = 'details-right-column';
            
              if (qrBlock) {
                // Create smaller QR block
                const qrClone = qrBlock.cloneNode(true);
                const qrDiv = qrClone.querySelector('div');
                if (qrDiv && qrDiv.id === 'qrcode') {
                  // Generate smaller QR for A5 (18mm = ~68px at 96dpi, but use 60px for safety)
                  generateQRCodeForClone(qrDiv, 60);
                }
                rightColumn.appendChild(qrClone);
              }
            
            // Assemble the container
            detailsContainer.appendChild(leftColumn);
            detailsContainer.appendChild(rightColumn);
            
            // Replace the top row and customer block with new layout
            const parentElement = topRow.parentElement;
            parentElement.insertBefore(detailsContainer, topRow.nextSibling);
            
            // Remove original customer block
            customerBlock.remove();
            
            // Keep the original top row for invoice number/date
            // Just remove the supplier and QR blocks from it
            const supplierBlockInTopRow = topRow.querySelector('.supplier-block');
            const qrBlockInTopRow = topRow.querySelector('.qr-block');
            if (supplierBlockInTopRow) supplierBlockInTopRow.remove();
            if (qrBlockInTopRow) qrBlockInTopRow.remove();
          }
        }
      }
    }

    // Helper to generate QR for cloned element
    function generateQRCodeForClone(qrElement, size) {
      qrElement.innerHTML = '';
      
      try {
        let qrcode = new QRCode({
          content: qrText,
          padding: 1,
          width: size,
          height: size,
          color: "#000000",
          background: "#ffffff",
          ecl: "M"
        });
        
        qrElement.innerHTML = qrcode.svg();
        
        const svg = qrElement.querySelector('svg');
  if (svg) {
    svg.style.border = 'none';
    svg.style.background = '#fff';
          svg.style.width = size + 'px';
          svg.style.height = size + 'px';
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
  }
      } catch (error) {
        console.error('QR code generation error:', error);
        qrElement.innerHTML = '<div style="color: red; font-size: 6px;">QR</div>';
      }
    }

    // Print Options Toggle
    function togglePrintOptions() {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.toggle('show');
      document.getElementById('pdfOptionsDropdown').classList.remove('show');
    }
    
    
    // Print Invoice Function
    function printInvoice(format) {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.remove('show');
      
      const invoiceContainer = document.getElementById('invoice-content');
      invoiceContainer.classList.remove('print-a4-format', 'print-a5-format', 'print-bill-format');
      
      const style = document.createElement('style');
      style.id = 'print-format-style';
      
      if (format === 'A4') {
        invoiceContainer.classList.add('print-a4-format');
        style.textContent = \`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              width: 100%;
              padding: 20px;
            }
            .qr-block-bottom {
              display: none !important;
            }
          }
       \`;
      } else if (format === 'A5') {
        invoiceContainer.classList.add('print-a5-format');
        style.textContent = \`
          @media print {
            @page {
              size: A5 landscape;
              margin: 3mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-size: 8px !important;
              line-height: 1.2 !important;
            }
            .invoice-container {
              width: 148mm !important;
              height: 105mm !important;
              padding: 5mm !important;
              font-size: 8px !important;
              overflow: visible !important;
              max-height: 105mm !important;
            }
            h1 {
              font-size: 12px !important;
              border-top: 1px solid black !important;
              border-bottom: 1px solid black !important;
              padding: 2px 0 !important;
              margin-bottom: 3px !important;
            }
            .sub-title {
              font-size: 9px !important;
              margin-bottom: 5px !important;
            }
            .details-container {
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              gap: 8px !important;
              margin-bottom: 6px !important;
            }
            .details-left-column {
              flex: 1 !important;
              display: flex !important;
              gap: 6px !important;
            }
            .supplier-column,
            .customer-column {
              flex: 1 !important;
              min-width: 0 !important;
            }
            .supplier-block,
            .customer-block {
              font-size: 7px !important;
              line-height: 1.3 !important;
              white-space: normal !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 3px !important;
              border: 0.5px solid #eee !important;
              border-radius: 2px !important;
              height: auto !important;
              max-height: none !important;
            }
            .details-right-column {
              flex-shrink: 0 !important;
              text-align: center !important;
              padding-left: 1mm !important;
              padding-right: 0 !important;
              width: 22mm !important;
              max-width: 22mm !important;
              overflow: hidden !important;
            }
            .qr-block {
              width: 100% !important;
              max-width: 22mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .qr-block div {
              width: 18mm !important;
              height: 18mm !important;
              max-width: 18mm !important;
              max-height: 18mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .qr-block svg {
              max-width: 18mm !important;
              max-height: 18mm !important;
              width: 18mm !important;
              height: 18mm !important;
              display: block !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .qr-label {
              font-size: 5px !important;
              width: 100% !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            .currency,
            .payment {
              font-size: 7px !important;
              margin: 4px 0 !important;
              padding: 2px 0 !important;
            }
            table {
              font-size: 6.5px !important;
              margin-top: 5px !important;
              margin-bottom: 5px !important;
              table-layout: fixed !important;
            }
            th, td {
              padding: 2px 1px !important;
              font-size: 6.5px !important;
              line-height: 1.1 !important;
            }
            .totals {
              margin-top: 6px !important;
              font-size: 7px !important;
              line-height: 1.3 !important;
            }
            .totals div {
              margin-bottom: 2px !important;
            }
            .totals span {
              width: 70px !important;
            }
            .invoice-value {
              font-size: 8px !important;
              margin-top: 6px !important;
              margin-bottom: 4px !important;
              text-align: right !important;
            }
            .words {
              font-size: 6.5px !important;
              margin-top: 4px !important;
              margin-bottom: 4px !important;
              line-height: 1.2 !important;
              max-height: 20px !important;
              overflow: visible !important;
            }
            .declaration {
              font-size: 6.5px !important;
              margin-top: 6px !important;
              line-height: 1.2 !important;
              overflow: visible !important;
            }
            .declaration div {
              margin-bottom: 2px !important;
            }
            * {
              overflow: visible !important;
              max-height: none !important;
            }
          }
        \`;
      } else if (format === 'Bill') {
        invoiceContainer.classList.add('print-bill-format');
        style.textContent = \`
          @media print {
            @page {
              size: 80mm 99999mm;
              margin: 1mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
              background: white !important;
            }
            body * { visibility: hidden !important; }
            .print-bill-format, .print-bill-format * { visibility: visible !important; }
            .print-bill-format { position: relative !important; left: 0 !important; top: 0 !important; width: 80mm !important; max-width: 80mm !important; overflow: visible !important; page-break-inside: avoid !important; }
            .print-bill-format .qr-block-bottom { page-break-inside: avoid !important; }
            
            /* CLEAN BILL/RECEIPT STYLE - key and value same font */
            .print-bill-format .label-bold {
              font-weight: 800 !important;
            }
            .print-bill-format .supplier-block,
            .print-bill-format .customer-block,
            .print-bill-format .top-row,
            .print-bill-format .top-row > div {
              font-weight: 800 !important;
            }
            .print-bill-format .invoice-container {
              width: 100% !important;
              padding: 3mm !important;
              font-size: 11px !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
              background: white;
              min-height: auto !important;
              max-width: 78mm !important;
              margin: 0 auto !important;
              border: none !important;
            }
            
            /* Center-align receipt header */
            .print-bill-format h1 {
              font-size: 18px !important;
              font-weight: 900 !important;
              line-height: 1.3 !important;
              border-top: none !important;
              border-bottom: none !important;
              padding: 3px 0 !important;
              margin-bottom: 5px !important;
              text-align: center !important;
              text-transform: uppercase !important;
              letter-spacing: 1px !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Receipt-style sub-title */
            .print-bill-format .sub-title {
              font-size: 12px !important;
              margin-top: 2px !important;
              margin-bottom: 8px !important;
              text-align: center !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Invoice header - compact */
            .print-bill-format .top-row {
              display: block !important;
              margin-top: 5px !important;
              margin-bottom: 5px !important;
              padding-bottom: 5px !important;
              border-bottom: 1px solid #ccc !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            .print-bill-format .top-row > div {
              margin-bottom: 3px !important;
              font-size: 11px !important;
              text-align: center !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Supplier/Customer info - clean layout */
            .print-bill-format .supplier-block {
              order: 1;
              margin-bottom: 8px !important;
              padding: 0 0 6px 0 !important;
              border-bottom: 1px solid #ddd !important;
              background: none !important;
              border-radius: 0 !important;
              border: none !important;
              font-size: 12px !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            .print-bill-format .customer-block {
              order: 2;
              margin-top: 0 !important;
              margin-bottom: 8px !important;
              padding: 0 0 6px 0 !important;
              border-bottom: 1px solid #ddd !important;
              background: none !important;
              border-radius: 0 !important;
              border: none !important;
              font-size: 12px !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Hide top QR code, show bottom one */
            .print-bill-format .qr-block {
              display: none !important;
            }
            
            /* Currency and payment info */
            .print-bill-format .currency,
            .print-bill-format .payment {
              font-size: 12px !important;
              font-weight: 800 !important;
              margin: 5px 0 !important;
              padding-bottom: 5px !important;
              border-bottom: 1px solid #ddd !important;
              text-align: center !important;
              border-top: none !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Receipt-style table - clean */
            .print-bill-format table {
              font-size: 10px !important;
              margin-top: 8px !important;
              margin-bottom: 8px !important;
              table-layout: fixed !important;
              width: 100% !important;
              border: none !important;
              border-bottom: 1px solid #ccc !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
              border-collapse: separate;
              border-spacing: 0;
            }
            
            .print-bill-format th {
              background: none !important;
              font-weight: 800 !important;
              padding: 3px 1px !important;
              border: none !important;
              font-size: 10px !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
              border-bottom: 1px solid #ccc !important;
            }
            
            .print-bill-format td {
              padding: 2px 1px !important;
              border: none !important;
              font-size: 10px !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
              border-bottom: 1px solid #eee !important;
            }
            
            .print-bill-format tbody tr:last-child td {
              border-bottom: none !important;
            }
            
            /* Totals section - clean */
            .print-bill-format .totals {
              margin-top: 10px !important;
              margin-bottom: 10px !important;
              padding: 0 0 6px 0 !important;
              border-bottom: 1px solid #ddd !important;
              background: none !important;
              border: none !important;
              border-radius: 0 !important;
              font-size: 12px !important;
              font-weight: 800 !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            .print-bill-format .totals div {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              flex-wrap: nowrap !important;
              white-space: nowrap !important;
              margin-bottom: 4px !important;
              padding: 0 !important;
              border-bottom: none !important;
              font-size: 12px !important;
              font-weight: 800 !important;
            }
            
            .print-bill-format .totals div:last-child {
              border-bottom: none !important;
              font-weight: 900 !important;
              margin-bottom: 0 !important;
            }
            
            .print-bill-format .totals span {
              flex-shrink: 0 !important;
              width: auto !important;
              font-size: 12px !important;
              font-weight: 800 !important;
            }
            
            /* Invoice value - clean emphasis */
            .print-bill-format .invoice-value {
              font-size: 14px !important;
              margin-top: 10px !important;
              margin-bottom: 8px !important;
              padding: 0 !important;
              text-align: center !important;
              font-weight: 900 !important;
              background: none !important;
              color: black !important;
              border-radius: 0 !important;
              border: none !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Amount in words - same size as Currency/Payment */
            .print-bill-format .words {
              font-size: 11px !important;
              margin-top: 8px !important;
              margin-bottom: 8px !important;
              padding: 0 0 6px 0 !important;
              border-bottom: 1px solid #ddd !important;
              font-style: italic !important;
              text-align: center !important;
              border-radius: 0 !important;
              background: none !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            /* Declaration - same size as Currency/Payment */
            .print-bill-format .declaration {
              margin-top: 10px !important;
              padding-top: 8px !important;
              border-top: 1px solid #ddd !important;
              font-size: 11px !important;
              text-align: center !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            .print-bill-format .declaration div {
              margin-bottom: 3px !important;
              font-size: 11px !important;
              font-weight: 800 !important;
            }
            
            /* QR code at bottom - smaller, less white space after */
            .print-bill-format .qr-block-bottom {
              display: block !important;
              text-align: center !important;
              margin: 8px auto 0 auto !important;
              width: 100% !important;
              padding: 0 3mm 0 0 !important;
              box-sizing: border-box !important;
              border-top: none !important;
              font-family: "OCR B", "OCR-B", "OCRB", monospace !important;
            }
            
            .print-bill-format .qr-block-bottom div {
              width: 45mm !important;
              height: 45mm !important;
              max-width: calc(100% - 6mm) !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: white !important;
              border: none !important;
              box-sizing: border-box !important;
            }
            
            .print-bill-format .qr-block-bottom div svg {
              width: 100% !important;
              height: 100% !important;
              display: block !important;
              margin: 0 auto !important;
            }
            .print-bill-format .qr-label {
              display: none !important;
            }
            
            /* Remove negative margin */
            .print-bill-format .customer-block[style*="margin-top:-80px"] {
              margin-top: 0 !important;
            }
            
            /* Column widths for receipt */
            .print-bill-format table th:nth-child(1),
            .print-bill-format table td:nth-child(1) {
              width: 8% !important;
            }
            
            .print-bill-format table th:nth-child(2),
            .print-bill-format table td:nth-child(2) {
              width: 30% !important;
            }
            
            .print-bill-format table th:nth-child(3),
            .print-bill-format table td:nth-child(3) {
              width: 10% !important;
            }
            
            .print-bill-format table th:nth-child(4),
            .print-bill-format table td:nth-child(4) {
              width: 10% !important;
            }
            
            .print-bill-format table th:nth-child(5),
            .print-bill-format table td:nth-child(5) {
              width: 15% !important;
            }
            
            .print-bill-format table th:nth-child(6),
            .print-bill-format table td:nth-child(6) {
              width: 15% !important;
            }
            
            .print-bill-format table th:nth-child(7),
            .print-bill-format table td:nth-child(7) {
              width: 12% !important;
            }
          }
        \`;
      }
      
      const existingStyle = document.getElementById('print-format-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // Setup A5 layout before printing
      if (format === 'A5') {
        setupA5Layout();
      }
      
      // Bill format: fast jsPDF path (no print)
      if (format === 'Bill') {
        buildBillPDFWithJSPDF();
        return;
      }
      
      window.print();
      
      setTimeout(() => {
        style.remove();
        invoiceContainer.classList.remove('print-a4-format', 'print-a5-format', 'print-bill-format');
        // Reload to reset layout
        location.reload();
      }, 100);
    }

    // Bill PDF: fast path using jsPDF only (no html2canvas) - same UI
    function buildBillPDFWithJSPDF() {
  var pdfBtn = document.getElementById('pdfDownloadBtn');
  var originalText = pdfBtn && pdfBtn.innerHTML;
  var loader = document.getElementById('bill-pdf-loader');
  if (pdfBtn) pdfBtn.disabled = true;
  if (loader) loader.style.display = 'flex';
  
  try {
    var d = window.__BILL_DATA__;
    if (!d) { 
      if (loader) loader.style.display = 'none'; 
      if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.innerHTML = originalText; } 
      return; 
    }
    
    var w = 80;
    // Bill QR: big and clear for physical print (max usable width on 80mm)
    var qrSizeMm = 50;
    var whiteSpaceAfterQrMm = 0.5;
    var bottomMarginMm = whiteSpaceAfterQrMm;
    var left = 1.5;
    var tempPdf = new jspdf.jsPDF({ unit: 'mm', format: [w, 400], compress: true });
    var calcY = 4;
    calcY += 5 + 6 + 5 + 4 + 6 + 5 + 5;
    tempPdf.setFontSize(9);
    if (d.supplierName) calcY += 4;
    if (d.supplierTpn) calcY += 4;
    if (d.supplierAddress) { var suppLines = tempPdf.splitTextToSize('Address: ' + (d.supplierAddress || ''), w - 2 * left); calcY += suppLines.length * 4 + 2; }
    if (d.supplierPhone) calcY += 6;
    calcY += 5;
    if (d.customerName) calcY += 4;
    if (d.customerEmail) calcY += 4;
    if (d.customerPhone) calcY += 4;
    if (d.customerAddress) { var addrLines = tempPdf.splitTextToSize('Address: ' + (d.customerAddress || ''), w - 2 * left); calcY += addrLines.length * 4 + 2; }
    calcY += 6 + 5 + 4;
    var payStr = 'Payment Mode: ' + (d.paymentMode || 'N/A');
    calcY += tempPdf.splitTextToSize(payStr, w - 2 * left).length * 4 + 2 + 6 + 4 + 4 + 4;
    tempPdf.setFontSize(7);
    if (d.items && d.items.length) {
      for (var ri = 0; ri < d.items.length; ri++) {
        var descL = tempPdf.splitTextToSize(String((d.items[ri].desc || '')), 19);
        calcY += (descL.length || 1) * 4;
      }
    }
    calcY += 4 + 6 + 4*4 + 6 + 4 + 5 + 5;
    var amtWordsStr = 'Amount in Words: ' + (d.amountInWords || '');
    calcY += tempPdf.splitTextToSize(amtWordsStr, w - 2 * left).length * 4 + 6 + 5 + 5 + 4 + 4;
    var posL = tempPdf.splitTextToSize('Place of Supply: ' + (d.placeOfSupply || ''), w - 2 * left);
    calcY += posL.length * 4 + 4;
    var itemCount = (d.items && d.items.length) ? d.items.length : 0;
    var trim = itemCount > 3 ? Math.min(8, itemCount * 0.5) : 0;
    var pageH = Math.max(165, calcY + qrSizeMm + bottomMarginMm - trim);
    var pdf = new jspdf.jsPDF({ unit: 'mm', format: [w, pageH], compress: true });
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, w, pageH, 'F');
    pdf.setDrawColor(0);
    pdf.setFont('helvetica', 'bold');
    var y = 4;
    pdf.setFontSize(11);
    pdf.text((d.title || 'Invoice'), w / 2, y, { align: 'center' });
    y += 5;
    pdf.setFontSize(9);
    pdf.text((d.subtitle !== undefined ? d.subtitle : 'Original'), w / 2, y, { align: 'center' });
    y += 6;
    pdf.line(1, y, w - 1, y);
    y += 5;
    pdf.setFontSize(8);
    pdf.text('Invoice No.: ' + (d.invoiceNo || ''), left, y);
    y += 4;
    pdf.text('Invoice Date: ' + (d.invoiceDate || ''), left, y);
    y += 6;
    pdf.line(1, y, w - 1, y);
    y += 5;
    pdf.setFontSize(9);
    if (d.supplierName) pdf.text('Supplier Name: ' + d.supplierName, left, y); y += 4;
    if (d.supplierTpn) pdf.text('TPN: ' + d.supplierTpn, left, y); y += 4;
    if (d.supplierAddress) { var suppAddrLines = pdf.splitTextToSize('Address: ' + d.supplierAddress, w - 2 * left); pdf.text(suppAddrLines, left, y); y += suppAddrLines.length * 4 + 2; }
    if (d.supplierPhone) pdf.text('Phone: ' + d.supplierPhone, left, y); y += 6;
    pdf.line(1, y, w - 1, y);
    y += 5;
    if (d.customerName) pdf.text('Customer Name: ' + d.customerName, left, y); y += 4;
    if (d.customerEmail) pdf.text('Email: ' + d.customerEmail, left, y); y += 4;
    if (d.customerPhone) pdf.text('Phone: ' + d.customerPhone, left, y); y += 4;
    if (d.customerAddress) { var addrLines = pdf.splitTextToSize('Address: ' + d.customerAddress, w - 2 * left); pdf.text(addrLines, left, y); y += addrLines.length * 4 + 2; }
    y += 6;
    pdf.line(1, y, w - 1, y);
    y += 5;
    pdf.text('Currency: ' + (d.currency || ''), left, y); y += 4;
    var paymentStr = 'Payment Mode: ' + (d.paymentMode || 'N/A');
    var paymentLines = pdf.splitTextToSize(paymentStr, w - 2 * left);
    pdf.text(paymentLines, left, y); y += paymentLines.length * 4 + 2;
    pdf.line(1, y, w - 1, y);
    y += 6;
    pdf.setFontSize(7);
    var colW = [7, 20, 5, 8, 10, 8, 18];
    var x0 = 1;
    var th = ['Sl.No.', 'Desc', 'Qty', 'U', 'Rate', 'Disc', 'Sale Amount'];
    for (var c = 0; c < colW.length; c++) {
      var cx = x0 + (c ? colW.slice(0, c).reduce(function(a,b){ return a+b; }, 0) : 0);
      pdf.text(th[c] || '', cx, y);
    }
    y += 4;
    pdf.line(1, y, w - 1, y);
    y += 4;
    if (d.items && d.items.length) {
      for (var r = 0; r < d.items.length; r++) {
        var row = d.items[r];
        var descLines = pdf.splitTextToSize(String(row.desc || ''), colW[1] - 1);
        if (descLines.length === 0) descLines = [''];
        for (var L = 0; L < descLines.length; L++) {
          pdf.text(String(row.sl || ''), x0, y);
          pdf.text(descLines[L], x0 + colW[0], y);
          if (L === 0) {
            pdf.text(String(row.qty || ''), x0 + colW[0] + colW[1], y);
            pdf.text(String((row.u || '').substring(0, 4)), x0 + colW[0] + colW[1] + colW[2], y);
            pdf.text(String(row.rate || ''), x0 + colW[0] + colW[1] + colW[2] + colW[3], y);
            pdf.text(String(row.disc || ''), x0 + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y);
            pdf.text(String(row.saleAmount || ''), x0 + colW[0] + colW[1] + colW[2] + colW[3] + colW[4] + colW[5], y);
          }
          y += 4;
        }
      }
    }
    y += 4;
    pdf.line(1, y, w - 1, y);
    y += 6;
    pdf.setFontSize(8);
    var valueX = 52;
    pdf.text('Total Amount', left, y); pdf.text(d.totalAmount || '', valueX, y); y += 4;
    pdf.text('Exempt Amount', left, y); pdf.text(d.exemptAmount || '', valueX, y); y += 4;
    pdf.text('Taxable Amount', left, y); pdf.text(d.taxableAmount || '', valueX, y); y += 4;
    pdf.text('GST@5%', left, y); pdf.text(d.gstAmount || '', valueX, y); y += 6;
    y += 4;
    pdf.line(1, y, w - 1, y);
    y += 5;
    pdf.setFontSize(9);
    pdf.text('Total Invoice Value: ' + (d.totalInvoiceValue || ''), w / 2, y, { align: 'center' });
    y += 5;
    pdf.setFontSize(7);
    pdf.text('Amount in Words: ' + (d.amountInWords || ''), left, y, { maxWidth: w - 2 * left });
    y += 6;
    pdf.line(1, y, w - 1, y);
    y += 5;
    pdf.text('Declaration: I/We certify that the particulars are true.', left, y); y += 4;
    pdf.text('Authorized Signature: _____________________', left, y); y += 4;
    var posStr = 'Place of Supply: ' + (d.placeOfSupply || '');
    var posLines = pdf.splitTextToSize(posStr, w - 2 * left);
    pdf.text(posLines, left, y); y += posLines.length * 4 + 4;
    var qrX = (w - qrSizeMm) / 2;
    
    try {
      // Bill QR: high-res raster for big, scannable print
      var qrPx = 640;
      var qrcode = new QRCode({ content: qrText, padding: 8, width: qrPx, height: qrPx, color: '#000000', background: '#ffffff', ecl: 'Q' });
      var svgStr = qrcode.svg();
      var canvas = document.createElement('canvas');
      canvas.width = qrPx;
      canvas.height = qrPx;
      var ctx = canvas.getContext('2d');
      try { ctx.imageSmoothingEnabled = false; } catch (e) {}
      var img = new Image();
      var svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(svgBlob);
      
      img.onload = function() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, qrPx, qrPx);
        var nw = img.naturalWidth || qrPx;
        var nh = img.naturalHeight || qrPx;
        var scale = Math.min(qrPx / nw, qrPx / nh, 1);
        var dw = Math.round(nw * scale);
        var dh = Math.round(nh * scale);
        var dx = (qrPx - dw) / 2;
        var dy = (qrPx - dh) / 2;
        ctx.drawImage(img, 0, 0, nw, nh, dx, dy, dw, dh);
        URL.revokeObjectURL(url);
        
        var qrData = canvas.toDataURL('image/png');
        pdf.addImage(qrData, 'PNG', qrX, y, qrSizeMm, qrSizeMm);
        
        var blob = pdf.output('blob');
        var pdfUrl = URL.createObjectURL(blob);
        
        // Check if browser is Edge
        var isEdge = /Edg/.test(navigator.userAgent);
        
        if (isEdge) {
          // EDGE: Hidden iframe - KEEPS PRINT DIALOG OPEN
          var edgeIframe = document.createElement('iframe');
          edgeIframe.style.position = 'absolute';
          edgeIframe.style.width = '0';
          edgeIframe.style.height = '0';
          edgeIframe.style.border = 'none';
          edgeIframe.style.left = '-9999px';
          edgeIframe.style.top = '-9999px';
          
          edgeIframe.onload = function() {
            // Wait for PDF to load, then print
            setTimeout(function() {
              try {
                edgeIframe.contentWindow.print();
              } catch(e) {
                // Fallback
                window.open(pdfUrl, '_blank');
              }
            }, 1000);
          };
          
          edgeIframe.src = pdfUrl;
          document.body.appendChild(edgeIframe);
          
          // DON'T remove iframe - let it stay until print dialog closes
          // Clean up only after a long time
          setTimeout(function() { 
            try {
              if (edgeIframe.parentNode) edgeIframe.parentNode.removeChild(edgeIframe);
              URL.revokeObjectURL(pdfUrl);
            } catch(e) {}
          }, 60000); // Clean up after 1 minute
          
        } else {
          // CHROME: Original iframe method
          var billIframe = document.createElement('iframe');
          billIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:80mm;min-height:400px;border:none;';
          billIframe.onload = function() {
            setTimeout(function() {
              try {
                if (billIframe.contentWindow) billIframe.contentWindow.print();
              } catch (err) {}
              // Chrome cleanup after print
              setTimeout(function() { 
                if (billIframe.parentNode) billIframe.parentNode.removeChild(billIframe); 
                URL.revokeObjectURL(pdfUrl); 
              }, 5000);
            }, 400);
          };
          document.body.appendChild(billIframe);
          billIframe.src = pdfUrl;
        }
        
        if (loader) loader.style.display = 'none';
        if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.innerHTML = originalText; }
      };
      
      img.onerror = function() {
        URL.revokeObjectURL(url);
        var blob = pdf.output('blob');
        var pdfUrl = URL.createObjectURL(blob);
        var isEdge = /Edg/.test(navigator.userAgent);
        
        if (isEdge) {
          var edgeIframe = document.createElement('iframe');
          edgeIframe.style.position = 'absolute';
          edgeIframe.style.width = '0';
          edgeIframe.style.height = '0';
          edgeIframe.style.border = 'none';
          edgeIframe.style.left = '-9999px';
          edgeIframe.style.top = '-9999px';
          
          edgeIframe.onload = function() {
            setTimeout(function() {
              try {
                edgeIframe.contentWindow.print();
              } catch(e) {}
            }, 1000);
          };
          
          edgeIframe.src = pdfUrl;
          document.body.appendChild(edgeIframe);
          
          setTimeout(function() { 
            try {
              if (edgeIframe.parentNode) edgeIframe.parentNode.removeChild(edgeIframe);
              URL.revokeObjectURL(pdfUrl);
            } catch(e) {}
          }, 60000);
        } else {
          var billIframe = document.createElement('iframe');
          billIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:80mm;min-height:400px;border:none;';
          billIframe.onload = function() {
            setTimeout(function() {
              try {
                if (billIframe.contentWindow) billIframe.contentWindow.print();
              } catch (err) {}
              setTimeout(function() { 
                if (billIframe.parentNode) billIframe.parentNode.removeChild(billIframe); 
                URL.revokeObjectURL(pdfUrl); 
              }, 5000);
            }, 400);
          };
          document.body.appendChild(billIframe);
          billIframe.src = pdfUrl;
        }
        
        if (loader) loader.style.display = 'none';
        if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.innerHTML = originalText; }
      };
      
      img.src = url;
    } catch (e) {
      var blob = pdf.output('blob');
      var pdfUrl = URL.createObjectURL(blob);
      var isEdge = /Edg/.test(navigator.userAgent);
      
      if (isEdge) {
        var edgeIframe = document.createElement('iframe');
        edgeIframe.style.position = 'absolute';
        edgeIframe.style.width = '0';
        edgeIframe.style.height = '0';
        edgeIframe.style.border = 'none';
        edgeIframe.style.left = '-9999px';
        edgeIframe.style.top = '-9999px';
        
        edgeIframe.onload = function() {
          setTimeout(function() {
            try {
              edgeIframe.contentWindow.print();
            } catch(e) {}
          }, 1000);
        };
        
        edgeIframe.src = pdfUrl;
        document.body.appendChild(edgeIframe);
        
        setTimeout(function() { 
          try {
            if (edgeIframe.parentNode) edgeIframe.parentNode.removeChild(edgeIframe);
            URL.revokeObjectURL(pdfUrl);
          } catch(e) {}
        }, 60000);
      } else {
        var billIframe = document.createElement('iframe');
        billIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:80mm;min-height:400px;border:none;';
        billIframe.onload = function() {
          setTimeout(function() {
            try {
              if (billIframe.contentWindow) billIframe.contentWindow.print();
            } catch (err) {}
            setTimeout(function() { 
              if (billIframe.parentNode) billIframe.parentNode.removeChild(billIframe); 
              URL.revokeObjectURL(pdfUrl); 
            }, 5000);
          }, 400);
        };
        document.body.appendChild(billIframe);
        billIframe.src = pdfUrl;
      }
      
      if (loader) loader.style.display = 'none';
      if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.innerHTML = originalText; }
    }
  } catch (err) {
    if (loader) loader.style.display = 'none';
    if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.innerHTML = originalText; }
  }
}






    // PDF Download Function - A4 only, optimized for size
    async function downloadPDF() {
      const pdfBtn = document.getElementById('pdfDownloadBtn');
      const originalText = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '⏳ Generating PDF...';
      pdfBtn.disabled = true;
      
      try {
        // Create temporary container - don't constrain width to avoid cutting content
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.overflow = 'visible'; // Ensure no clipping
        tempContainer.style.width = 'auto'; // Let content determine width
        tempContainer.style.maxWidth = 'none'; // Remove max-width constraints
        
        // Clone the invoice
        const invoiceClone = document.getElementById('invoice-content').cloneNode(true);
        
        // Ensure cloned invoice doesn't have width constraints that cut content
        invoiceClone.style.width = '794px'; // Keep original width
        invoiceClone.style.maxWidth = '794px';
        invoiceClone.style.overflow = 'visible';
        invoiceClone.style.boxSizing = 'border-box';
        
        tempContainer.appendChild(invoiceClone);
        document.body.appendChild(tempContainer);
        
        // Reduced wait time for faster generation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // HTML to Canvas - higher scale for crisp PDF (still small)
        const canvas = await html2canvas(invoiceClone, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false,
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Ensure cloned document has proper overflow and full width
            const clonedContainer = clonedDoc.getElementById('invoice-content');
            if (clonedContainer) {
              clonedContainer.style.overflow = 'visible';
              clonedContainer.style.width = '794px';
              clonedContainer.style.maxWidth = 'none';
              // Ensure all child elements don't clip
              const allElements = clonedContainer.querySelectorAll('*');
              allElements.forEach(el => {
                if (el.style.overflow === 'hidden') {
                  el.style.overflow = 'visible';
                }
              });
            }
          }
        });

        // JPEG at higher quality avoids hazy/bluish artifacts while staying < ~2MB
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        
        // Canvas to PDF
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true // Enable compression
        });
        
        // Calculate dimensions to fit A4 (210mm x 297mm)
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = 297; // A4 height in mm
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // For most invoices, content fits on one page - use single page
        // Only split if content is significantly taller (more than 10mm over)
        if (imgHeight > pdfHeight + 10) {
          // Multi-page: split content across pages
          let yOffset = 0;
          let isFirstPage = true;
          
          while (yOffset < imgHeight) {
            if (!isFirstPage) {
              pdf.addPage();
            }
            isFirstPage = false;
            
            // Calculate remaining height
            const remainingHeight = imgHeight - yOffset;
            
            // Only add page if there's meaningful content (more than 20mm)
            if (remainingHeight > 20) {
              pdf.addImage(
                imgData, 
                'JPEG', 
                0, 
                -yOffset, // Offset to show correct portion
                imgWidth, 
                imgHeight,
                undefined, 
                'SLOW'
              );
              yOffset += pdfHeight;
            } else {
              // Don't create a page for tiny remaining content
              break;
            }
          }
        } else {
          // Single page - most common case
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'SLOW');
        }
        
        // Save PDF
        const filename = 'invoice-performa-' + ('${sales.sales_invoice_no || salesId}') + '.pdf';
        pdf.save(filename);
        
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
      } finally {
        pdfBtn.innerHTML = originalText;
        pdfBtn.disabled = false;
        // Clean up temporary container
        const tempDiv = document.querySelector('div[style*="left: -9999px"]');
        if (tempDiv) {
          document.body.removeChild(tempDiv);
        }
      }
    }
    
    // Helper function to generate QR code for cloned element
    function generateQRCodeClone(elementId, size) {
      const qrcodeElement = document.getElementById(elementId);
      if (!qrcodeElement) return;
      
      qrcodeElement.innerHTML = '';
      
      try {
        let qrcode = new QRCode({
          content: qrText,
          padding: 2,
          width: size,
          height: size,
          color: "#000000",
          background: "#ffffff",
          ecl: "M"
        });
        
        qrcodeElement.innerHTML = qrcode.svg();
        
        const svg = qrcodeElement.querySelector('svg');
        if (svg) {
          svg.style.border = 'none';
          svg.style.background = '#fff';
          svg.style.width = size + 'px';
          svg.style.height = size + 'px';
          svg.style.display = 'block';
          svg.style.margin = '0 auto';
        }
      } catch (error) {
        console.error('QR code generation error:', error);
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      // Generate QR codes
      generateQRCode('qrcode', 120);
      generateQRCode('qrcode-bottom-content', 50);
      
      // Event listeners
      document.getElementById('printOptionsBtn').addEventListener('click', togglePrintOptions);
      document.getElementById('pdfDownloadBtn').addEventListener('click', downloadPDF);
      
      // Print options
      document.querySelectorAll('#printOptionsDropdown .print-option-item').forEach(option => {
        option.addEventListener('click', function() {
          printInvoice(this.getAttribute('data-format'));
        });
      });
      
      // Close dropdowns on outside click
      document.addEventListener('click', function(event) {
        const printBtn = document.getElementById('printOptionsBtn');
        const printDropdown = document.getElementById('printOptionsDropdown');
        
        if (!printBtn.contains(event.target) && !printDropdown.contains(event.target)) {
          printDropdown.classList.remove('show');
        }
      });
    });
  </script>
</body>
</html>`;
}

// Helper function to get unit type based on sales_item_type
function getUnitType(salesItemType) {
  if (!salesItemType) return 'Pcs';

  const unitMap = {
    'GOODS': 'Pcs',
    'SERVICE': 'Unit',
    'ELECTRONIC': 'Unit',
    'FOOD': 'Pacs',
    'LIQUID': 'Ltr',
    'OTHER': 'Unit'
  };

  return unitMap[salesItemType] || 'Pcs';
}

