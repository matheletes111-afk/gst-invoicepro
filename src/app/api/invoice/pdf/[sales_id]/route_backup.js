import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const salesId = Number(params.sales_id);

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
    s.upi_id,
    s.check_number,
    s.journal_number,

  FROM tbl_sales AS s
  LEFT JOIN currency AS c ON s.currency = c.currencyId
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
      FROM party
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
            SELECT * FROM businessparty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.businessName || sales.customer_name || "Business";
        partyRegistrationNo = partyDetails?.companyRegistrationNo || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "GOVERNMENT_AGENCY":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM governmentagencyparty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.agencyName || sales.customer_name || "Government Agency";
        partyRegistrationNo = partyDetails?.agencyRegistrationNo || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "CORPORATION":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM corporationparty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.corporationName || sales.customer_name || "Corporation";
        partyRegistrationNo = partyDetails?.registrationNumber || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "CSO":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM csoparty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = partyDetails?.csoName || sales.customer_name || "CSO";
        partyRegistrationNo = partyDetails?.csoRegistrationNo || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "INDIVIDUAL":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM individualparty WHERE partyId = ${party.partyId} LIMIT 1
          `
        )[0];
        partyDisplayName = sales.customer_name || "Individual";
        partyRegistrationNo = partyDetails?.cid || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;
    }

    /* ---------------- ORGANIZATION ---------------- */
    const orgResult = await prisma.$queryRaw`
      SELECT *
      FROM organization
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

    switch (org.orgType) {
      case "business":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM businessdetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.businessName || "";
        orgCode = orgDetails?.businessNameCode || "";
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "government":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM governmentagencydetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.agencyName || "";
        orgCode = orgDetails?.agencyCode || "";
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "corporation":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM corporationdetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.corporationName || "";
        orgCode = orgDetails?.organizationCode || "";
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "cso":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM csodetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.agencyName || "";
        orgCode = orgDetails?.agencyCode || "";
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;
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
  LEFT JOIN unit AS u
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
        tpn: sales.customer_tpn || partyRegistrationNo,
        address: partyAddress,
        email: partyEmail,
        phone: partyPhone
      },
      organization: {
        name: orgName,
        tpn: orgCode,
        address: orgAddress,
        phone: orgPhone
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - ${sales.sales_invoice_no || 'INV/2025/001'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        /* Header Layout for PDF */
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 2px solid #000;
    page-break-inside: avoid; /* Prevents splitting in PDF */
}

.header-main {
    flex: 1;
}

.header-details {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.invoice-no-date {
    margin-bottom: 15px;
}

/* QR Code Styling */
.qr-container {
    text-align: center;
}

#qrcode {
    width: 90px;
    height: 90px;
    display: inline-block;
    border: 1px solid #ddd;
    padding: 4px;
    background: #fff;
}

.qr-label {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
}

/* Print/PDF Specific Adjustments */
@media print {
    .header-section {
        border-bottom: 2pt solid #000; /* Thicker line for print */
    }
    #qrcode {
        border: 1pt solid #000; /* Thicker border for print */
        width: 80px; /* Slightly smaller for print */
        height: 80px;
    }
}
        body {
            background-color: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .invoice-container {
            width: 794px; /* A4 width in pixels */
            min-height: 1123px; /* A4 height in pixels */
            background: white;
            padding: 70px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        
        /* Header Section */
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
        }
        
        .left-header {
            flex: 1;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .original-badge {
            font-size: 14px;
            font-weight: bold;
            color: #ff0000;
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid #ff0000;
            border-radius: 3px;
        }
        
        .right-header {
            text-align: right;
        }
        
        .invoice-no-date {
            margin-bottom: 20px;
        }
        
        .invoice-info {
            font-size: 13px;
            margin-bottom: 3px;
        }
        
        .invoice-info strong {
            color: #000;
        }
        
        /* QR Code in Header - USING SVG BASE64 */
        .qr-container {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .qr-code-svg {
            width: 80px;
            height: 80px;
            border: 1px solid #ddd;
            margin-bottom: 5px;
        }
        
        .qr-label {
            font-size: 10px;
            color: #666;
        }
        
        /* Details Section */
        .details-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .supplier-details, .customer-details {
            font-size: 13px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ddd;
        }
        
        .detail-row {
            margin-bottom: 5px;
            display: flex;
        }
        
        .detail-label {
            font-weight: bold;
            color: #000;
            min-width: 100px;
        }
        
        .detail-value {
            color: #333;
        }
        
        /* Currency */
        .currency-section {
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0;
            color: #000;
        }
        
        /* Items Table */
        .items-table-container {
            margin: 20px 0;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .items-table th {
            background-color: #f2f2f2;
            padding: 8px 5px;
            text-align: left;
            font-weight: bold;
            color: #000;
            border: 1px solid #ddd;
        }
        
        .items-table td {
            padding: 8px 5px;
            border: 1px solid #ddd;
            color: #333;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        /* Totals Section */
        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        .totals-table td {
            padding: 8px 0;
        }
        
        .totals-table td:first-child {
            text-align: right;
            padding-right: 20px;
            color: #333;
            font-weight: bold;
        }
        
        .totals-table td:last-child {
            text-align: right;
            color: #000;
            font-weight: bold;
            min-width: 120px;
        }
        
        .grand-total-row {
            border-top: 2px solid #000;
            font-size: 14px;
            font-weight: bold;
        }
        
        /* Amount in Words */
        .amount-in-words {
            margin-top: 20px;
            padding: 12px;
            background-color: #f8f9fa;
            border-left: 3px solid #000;
            font-size: 13px;
            color: #333;
        }
        
        /* Declaration and Footer */
        .declaration {
            margin-top: 25px;
            font-size: 13px;
            color: #333;
            font-style: italic;
        }
        
        .footer-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        
        .signature-section {
            text-align: center;
        }
        
        .signature-line {
            width: 200px;
            height: 1px;
            background: #000;
            margin: 40px 0 5px 0;
        }
        
        .place-of-supply {
            font-size: 13px;
            color: #333;
        }
        
        /* Print and Download Buttons */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
            z-index: 1000;
        }
        
        .pdf-button {
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 10px 20px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
            z-index: 1000;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                padding: 20px;
                width: 100%;
                min-height: auto;
            }
            
            .print-button, .pdf-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    
    <button class="pdf-button" id="pdfBtn" onclick="downloadPDF()">
        <span id="pdfBtnText">📥 Download PDF</span>
        <span id="pdfBtnSpinner" style="display: none; margin-left: 8px;">
            <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span>
        </span>
    </button>
    
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    
    <div class="invoice-container" id="invoice-content">
        <!-- Header Section -->
        <!-- Header Section -->
<div class="header-section" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 0px solid #000 !important; width: 100%;">
    <div style="flex: 1;">
        <div style="font-size: 28px; font-weight: bold; color: #000; margin-bottom: 5px;">Tax Invoice</div>
        <div style="font-size: 14px; font-weight: bold; color: #ff0000; display: inline-block; padding: 2px 8px; border: 1px solid #ff0000; border-radius: 3px;">Original</div>
    </div>
    
    <div style="text-align: right; max-width: 300px;">
        <div style="margin-bottom: 15px;">
            <div style="font-size: 13px; margin-bottom: 3px;">
                <strong>Invoice No.:</strong> ${sales.sales_invoice_no || 'INV/2025/001'}
            </div>
            <div style="font-size: 13px;">
                <strong>Invoice Date:</strong> ${formatDate(sales.sales_date)}
            </div>
        </div>
        
        <div style="text-align: center; width: 95px; margin-left: auto;">
            <div id="qrcode" style="width: 90px;    margin-left: -25px;
    margin-top: -8px;
 height: 90px; border:none; padding: 3px; background: #fff; display: block;"></div>
        </div>
    </div>
</div>

        
        <!-- Supplier and Customer Details -->
        <div class="details-section">
            <div class="supplier-details">
                <div class="section-title">Supplier Details</div>
                <div class="detail-row">
                    <span class="detail-label">Supplier Name:</span>
                    <span class="detail-value">${organization.name || 'Druk Trading Pvt. Ltd.'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">TPN:</span>
                    <span class="detail-value">${organization.tpn || '10123484'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${organization.address || 'Norzhi Lam, Thimphu, Bhutan'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${organization.phone || '+975-2-333444'}</span>
                </div>
            </div>
            
            <div class="customer-details">
                <div class="section-title">Customer Details</div>
                <div class="detail-row">
                    <span class="detail-label">Customer Name:</span>
                    <span class="detail-value">${party.name || 'Bhutan Agro Ltd.'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">TPN:</span>
                    <span class="detail-value">${party.tpn || '101999988'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${party.address || 'Phuentaholing, Bhutan'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${party.email || 'harkafley@gmail.com'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${party.phone || '17118424'}</span>
                </div>
            </div>
        </div>
        
        <!-- Currency -->
        <div class="currency-section">
            Currency: ${sales.currencyName}
        </div>
        
        <!-- Items Table -->
        <div class="items-table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Sl.No.</th>
                        <th>Item</th>
                        
                        <th>Unit</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Discount</th>
                        <th>After discount</th>
                        <th>GST(%)</th>
                        <th>GST Amount</th>
                        <th>Total</th>

                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${item.goods_service_name || ''}</td>
                        
                        <td class="text-center">${item.name || 'Pcs'}</td>
                        <td class="text-right">${formatCurrency(item.unit_price)}</td>
                        <td class="text-center">${item.quantity || ''}</td>
                        <td class="text-right">${formatCurrency(item.discount)}</td>
                        <td class="text-right">${formatCurrency(item.amount_after_discount)}</td>
                        <td class="text-right">${item.gst_percentage}</td>
                        <td class="text-right">${item.gst_amount}</td>
                        <td class="text-right">${item.goods_service_total_amount}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Totals Section -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Total Amount</td>
                    <td>${formatCurrency(sales.sales_amount)}</td>
                </tr>
                <tr>
                    <td>Exempt Amount</td>
                    <td>${formatCurrency(sales.exempt_amount)}</td>
                </tr>
                <tr>
                    <td>Taxable Amount</td>
                    <td>${formatCurrency(sales.taxable_amount)}</td>
                </tr>
                <tr>
                    <td>GST@5%</td>
                    <td>${formatCurrency(sales.gst_amount)}</td>
                </tr>
                <tr class="grand-total-row">
                    <td>Total Invoice Value:</td>
                    <td>${formatCurrency(sales.total_invoice_amount)}</td>
                </tr>
            </table>
        </div>
        
        <!-- Amount in Words -->
        <div class="amount-in-words">
            <strong>Amount in Words:</strong> ${numberToWords(sales.total_invoice_amount)} ${sales.currencyName} Only
        </div>
        
        <!-- Declaration -->
        <div class="declaration">
            <strong>Declaration:</strong> I/We certify that the particulars are true.
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div style="font-size: 13px; color: #000; margin-top: 5px;">Authorized Signature</div>
            </div>
            <div class="place-of-supply">
                <strong>Place of Supply:</strong> Thimphu, Bhutan
            </div>
        </div>
    </div>

    <!-- QR Code Library -->
    <!-- Replace the QRCode library with this one -->
<script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
    <!-- PDF Generation Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <script>
        const qrText = \`INVOICE:${sales.sales_invoice_no}
                        DATE:${formatDateForQR(sales.sales_date)}
                        invoiceType: "original",
                        issuedBy: "supplier",
                        supplierTpn: ${organization.tpn},
                        goodType: "New Goods / Services",
                        verificationUrl: "https://gst.drcs.bt/verify/${sales.sales_invoice_no}"
                        AMOUNT:${sales.total_invoice_amount}\`;
    
    document.addEventListener('DOMContentLoaded', function() {
        const qrcodeElement = document.getElementById('qrcode');
        qrcodeElement.innerHTML = '';
        
        // Using qrcode-svg library
        const qrcode = new QRCode({
            content: qrText,
            padding: 2,
            width: 120,
            height: 120,
            color: "#000000",
            background: "#ffffff",
            ecl: "H"
        });
        
        qrcodeElement.innerHTML = qrcode.svg();
        
        // Ensure proper styling
        const svg = qrcodeElement.querySelector('svg');
        if (svg) {
            svg.style.border = 'none';
            svg.style.padding = '3px';
            svg.style.background = '#fff';
        }
    });

        // PDF Download Function
        async function downloadPDF() {
            const invoiceElement = document.getElementById('invoice-content');
            const pdfBtn = document.getElementById('pdfBtn');
            const pdfBtnText = document.getElementById('pdfBtnText');
            const pdfBtnSpinner = document.getElementById('pdfBtnSpinner');
            
            // Show generating state
            const originalText = pdfBtnText.textContent;
            pdfBtnText.textContent = '⏳ Generating PDF...';
            pdfBtnSpinner.style.display = 'inline-block';
            pdfBtn.disabled = true;
            
            try {
                // Wait a moment for QR code to render
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Convert HTML to canvas
                const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
onclone: function(clonedDoc) {

    // REMOVE ALL BORDERS IN THE PDF SECTION
    const invoice = clonedDoc.getElementById('invoice');
    if (invoice) {
        invoice.querySelectorAll('*').forEach(el => {
            el.style.border = "none";
            el.style.outline = "none";
            el.style.boxShadow = "none"; // remove shadows too
        });
    }

    // QR CODE FIX
    const clonedQR = clonedDoc.getElementById('qrcode');
    if (clonedQR) {
        clonedQR.style.border = "none";
        clonedQR.style.outline = "none";

        if (clonedQR.innerHTML === '') {
            new QRCode(clonedQR, {
                text: JSON.stringify(qrText),
                width: 90,
                height: 90,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
}

});

                // Show downloading state
                pdfBtnText.textContent = '⬇️ Downloading...';
                
                // Convert canvas to PDF
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                
                // Save the PDF
                pdf.save('invoice-${sales.sales_invoice_no || salesId}.pdf');
                
                // Wait a moment to show downloading state
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error('PDF generation error:', error);
                alert('Error generating PDF. Please try again.');
            } finally {
                // Restore button text and state
                pdfBtnText.textContent = originalText;
                pdfBtnSpinner.style.display = 'none';
                pdfBtn.disabled = false;
            }
        }
    </script>
</body>
</html>
  `;
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

