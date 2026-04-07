import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const salesId = Number(params.sales_id);
    
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
    s.created_on
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
        partyRegistrationNo = partyDetails?.companyRegistrationNo || "";
        partyEmail = partyDetails?.email || "";
        partyPhone = partyDetails?.phone || "";
        partyAddress = partyDetails?.address || "";
        break;

      case "GOVERNMENT_AGENCY":
        partyDetails = (
          await prisma.$queryRaw`
            SELECT * FROM GovernmentAgencyParty WHERE partyId = ${party.partyId} LIMIT 1
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
            SELECT * FROM CorporationParty WHERE partyId = ${party.partyId} LIMIT 1
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
            SELECT * FROM CSOParty WHERE partyId = ${party.partyId} LIMIT 1
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
            SELECT * FROM IndividualParty WHERE partyId = ${party.partyId} LIMIT 1
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

    switch (org.orgType) {
      case "business":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM BusinessDetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.businessName || "";
        // orgCode = orgDetails?.businessNameCode || "";
          orgCode = orgDetails?.taxpayerNumber || ''
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "government":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM GovernmentAgencyDetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.agencyName || "";
        // orgCode = orgDetails?.agencyCode || "";
         orgCode = orgDetails?.tpn || ''
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "corporation":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM CorporationDetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.corporationName || "";
        // orgCode = orgDetails?.organizationCode || "";
         orgCode = orgDetails?.tpn || ''
        orgAddress = orgDetails?.address || "";
        orgPhone = orgDetails?.phone || "";
        break;

      case "cso":
        orgDetails = (
          await prisma.$queryRaw`
            SELECT * FROM CsoDetails WHERE organizationId = ${org.id} LIMIT 1
          `
        )[0];
        orgName = orgDetails?.agencyName || "";
        // orgCode = orgDetails?.agencyCode || "";
         orgCode = orgDetails?.tpn || ''
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
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${sales.sales_invoice_no || 'INV/2025/001'}</title>

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
    <h1 style="border-top: 2px solid black;
    border-bottom: 2px solid black;
    line-height: 57px;">Tax Invoice</h1>
    <div class="sub-title">Copy</div>

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
        <span class="label-bold">Supplier Name:</span> ${organization.name || 'Druk Trading Pvt. Ltd.'}<br>
        <span class="label-bold">TPN:</span> ${organization.tpn || '10123484'}<br>
        <span class="label-bold">Address:</span> ${organization.address || 'Norzhi Lam, Thimphu, Bhutan'}<br>
        <span class="label-bold">Email:</span> info@druktrading.bt<br>
        <span class="label-bold">Phone:</span> ${organization.phone || '+975-2-333444'}<br>
      </div>

      <div class="qr-block">
        <div id="qrcode"></div>
      </div>
    </div>

    <!-- Customer -->
    <div class="customer-block" style="margin-top:-80px;">
      <span class="label-bold">Customer Name:</span> ${party.name || 'Bhutan Agro Ltd.'}<br>
      <!-- <span class="label-bold">TPN:</span> ${party.tpn || '101999988'}<br> -->
      <span class="label-bold">Address:</span> ${party.address || 'Phuentaholing, Bhutan'}<br>
      <span class="label-bold">Email:</span> ${party.email || 'harkafley@gmail.com'}<br>
      <span class="label-bold">Phone:</span> ${party.phone || '17118424'}<br>
    </div>

    <div class="currency">Currency: ${sales.currencyName}</div>

    <!-- ITEMS TABLE -->
    <table>
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
      <div>Place of Supply: Thimphu, Bhutan</div>
    </div>
  </div>

  <!-- Action Buttons Below Invoice -->
  <div class="button-container">
    <div style="position: relative;">
      <button class="print-options-button" id="printOptionsBtn" onclick="togglePrintOptions()">
        🖨️ Print Options
      </button>
      <div class="print-options-dropdown" id="printOptionsDropdown">
        <div class="print-option-item" onclick="printInvoice('A4')">A4</div>
        <div class="print-option-item" onclick="printInvoice('A5')">A5</div>
        <div class="print-option-item" onclick="printInvoice('Bill')">Bill Format</div>
      </div>
    </div>
    <button class="pdf-button" id="pdfBtn" onclick="downloadPDF()">
      <span id="pdfBtnText">📥 Download PDF</span>
      <span id="pdfBtnSpinner" style="display: none; margin-left: 8px;">
        <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span>
      </span>
    </button>
    <a href="/sales" class="close-button">
      ❌ Close
    </a>
  </div>

  <!-- QR Code Library -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
  <!-- PDF Generation Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    const qrText = \`INVOICE:${sales.sales_invoice_no}
                    DATE:${formatDateForQR(sales.sales_date)}
                    invoiceType: "copy",
                    issuedBy: "supplier",
                    supplierTpn: ${organization.tpn},
                    goodType: "New Goods / Services",
                    verificationUrl: "https://gst.drcs.bt/verify/${sales.sales_invoice_no}"
                    AMOUNT:${sales.total_invoice_amount}\`;
    const compactQrText = \`INV:${sales.sales_invoice_no}|DATE:${formatDateForQR(sales.sales_date)}|AMT:${sales.total_invoice_amount}|TPN:${organization.tpn}\`;

    document.addEventListener('DOMContentLoaded', function() {
      const qrcodeElement = document.getElementById('qrcode');
      qrcodeElement.innerHTML = '';
      
      try {
        // Try with medium error correction level (supports more data than H)
        let qrcode = new QRCode({
          content: qrText,
          padding: 2,
          width: 120,
          height: 120,
          color: "#000000",
          background: "#ffffff",
          ecl: "M"
        });
        
        qrcodeElement.innerHTML = qrcode.svg();
      } catch (error) {
        console.error('QR code generation error (M level):', error);
        try {
          // Fallback to low error correction level (supports most data)
          const qrcode = new QRCode({
            content: qrText,
            padding: 2,
            width: 120,
            height: 120,
            color: "#000000",
            background: "#ffffff",
            ecl: "L"
          });
          
          qrcodeElement.innerHTML = qrcode.svg();
        } catch (fallbackError) {
          console.error('QR code generation error (L level):', fallbackError);
          // Final fallback: use compact format
          try {
            const fallbackQr = new QRCode({
              content: compactQrText,
              padding: 2,
              width: 120,
              height: 120,
              color: "#000000",
              background: "#ffffff",
              ecl: "L"
            });
            
            qrcodeElement.innerHTML = fallbackQr.svg();
          } catch (finalError) {
            console.error('QR code generation failed:', finalError);
            qrcodeElement.innerHTML = '<div style="color: red; font-size: 10px; padding: 50px 10px;">QR Code Error</div>';
          }
        }
      }
      
      // Ensure proper styling
      const svg = qrcodeElement.querySelector('svg');
      if (svg) {
        svg.style.border = 'none';
        svg.style.background = '#fff';
        svg.style.width = '120px';
        svg.style.height = '120px';
      }
    });

    // Print Options Toggle
    function togglePrintOptions() {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.toggle('show');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      const printBtn = document.getElementById('printOptionsBtn');
      const dropdown = document.getElementById('printOptionsDropdown');
      if (!printBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    });
    
    // Print Invoice Function
    function printInvoice(format) {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.remove('show');
      
      // Add format-specific CSS
      const style = document.createElement('style');
      style.id = 'print-format-style';
      
      if (format === 'A4') {
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
          }
        \`;
      } else if (format === 'A5') {
        style.textContent = \`
          @media print {
            @page {
              size: A5;
              margin: 8mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              width: 100%;
              padding: 15px;
              font-size: 12px;
            }
            table {
              font-size: 11px;
            }
            th, td {
              padding: 4px;
            }
          }
        \`;
      } else if (format === 'Bill') {
        style.textContent = \`
          @media print {
            @page {
              size: 80mm 297mm;
              margin: 5mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              width: 100%;
              padding: 10px;
              font-size: 11px;
            }
            h1 {
              font-size: 18px;
            }
            table {
              font-size: 10px;
            }
            th, td {
              padding: 3px;
            }
            .top-row {
              margin-top: 10px;
            }
            .totals {
              margin-top: 10px;
            }
          }
        \`;
      }
      
      // Remove existing format style if any
      const existingStyle = document.getElementById('print-format-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // Trigger print
      window.print();
    }
    
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
          backgroundColor: '#ffffff'
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

