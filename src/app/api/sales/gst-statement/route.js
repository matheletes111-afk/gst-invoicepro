import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

function parseAddressFromJson(json) {
  try {
    if (!json) return '';

    const data = typeof json === 'string' ? JSON.parse(json) : json;

    const parts = [
      data.flatNo && `Flat: ${data.flatNo}.`,
          data.buildingNo && `Building: ${data.buildingNo}.`,
          data.locality && `Locality: ${data.locality}.`,
          data.wardName && `Street: ${data.wardName}.`,
          data.village && `Village: ${data.village}.`,
          data.gewog && `Gewog: ${data.gewog}.`,
          data.dzongkhag && `Dzongkhag: ${data.dzongkhag}.`
    ];

    return parts.filter(Boolean).join(', ');
  } catch (error) {
    console.error('Invalid address JSON:', error);
    return '';
  }
}

export async function POST(request) {
  try {
    // Get organization ID from authentication
    const organizationId = await getOrganizationIdFromRequest(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get data from JSON body
    const body = await request.json();
    const { salesIds, fromDate, toDate } = body;
    
    console.log('=== API DEBUG START ===');
    console.log('Received organizationId:', organizationId);
    console.log('Received salesIds:', salesIds);
    console.log('Received fromDate:', fromDate);
    console.log('Received toDate:', toDate);

    if (!salesIds || !fromDate || !toDate) {
      console.log('Missing parameters error');
      return NextResponse.json(
        { message: "Missing parameters. salesIds, fromDate, and toDate are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(salesIds) || salesIds.length === 0) {
      console.log('Invalid salesIds array error');
      return NextResponse.json(
        { message: "Invalid salesIds format" },
        { status: 400 }
      );
    }

    // Convert all salesIds to numbers
    const numericSalesIds = salesIds.map(id => {
      const num = Number(id);
      if (isNaN(num)) {
        console.log('Invalid salesId:', id);
      }
      return num;
    }).filter(id => !isNaN(id));

    if (numericSalesIds.length === 0) {
      console.log('No valid numeric salesIds');
      return NextResponse.json(
        { message: "No valid sales IDs provided" },
        { status: 400 }
      );
    }

    console.log('Processing GST statement for sales IDs:', numericSalesIds);

    // Get organization details using raw SQL queries
    const orgQuery = await prisma.$queryRaw`
      SELECT * FROM Organization WHERE id = ${organizationId} LIMIT 1
    `;
    
    console.log('Organization query result:', orgQuery);

    if (!orgQuery || orgQuery.length === 0) {
      console.log('Organization not found');
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    const organization = orgQuery[0];
    console.log('Organization type:', organization.orgType);

    let orgInfo = {
      name: '',
      tpn: '',
      address: '',
      phone: '',
      email: ''
    };

    // Get organization details based on type using raw SQL
    switch (organization.orgType) {
      case 'business':
        const businessDetails = await prisma.$queryRaw`
          SELECT * FROM BusinessDetails WHERE organizationId = ${organizationId} LIMIT 1
        `;
        console.log('Business details:', businessDetails);
        if (businessDetails && businessDetails.length > 0) {
          const details = businessDetails[0];
          orgInfo = {
            name: details.businessName || '',
            tpn: details.businessNameCode || '',
            address: parseAddressFromJson(details.businessLocationJson),
            phone: details.officePhone || '',
            email: details.officeEmail || ''
          };
        }
        break;

      case 'government':
        const govDetails = await prisma.$queryRaw`
          SELECT * FROM GovernmentAgencyDetails WHERE organizationId = ${organizationId} LIMIT 1
        `;
        console.log('Government details:', govDetails);
        if (govDetails && govDetails.length > 0) {
          const details = govDetails[0];
          orgInfo = {
            name: details.agencyName || '',
            tpn: details.agencyCode || '',
            address: details.taxpayerRegistrationRegion || '',
            phone: details.contactPhone || '',
            email: details.contactEmail || ''
          };
        }
        break;

      case 'corporation':
        const corpDetails = await prisma.$queryRaw`
          SELECT * FROM CorporationDetails WHERE organizationId = ${organizationId} LIMIT 1
        `;
        console.log('Corporation details:', corpDetails);
        if (corpDetails && corpDetails.length > 0) {
          const details = corpDetails[0];
          orgInfo = {
            name: details.corporationName || '',
            tpn: details.organizationCode || '',
            address: details.taxpayerRegistrationRegion || '',
            phone: details.contactPhone || '',
            email: details.contactEmail || ''
          };
        }
        break;

      case 'cso':
        const csoDetails = await prisma.$queryRaw`
          SELECT * FROM CsoDetails WHERE organizationId = ${organizationId} LIMIT 1
        `;
        console.log('CSO details:', csoDetails);
        if (csoDetails && csoDetails.length > 0) {
          const details = csoDetails[0];
          orgInfo = {
            name: details.agencyName || '',
            tpn: details.agencyCode || '',
            address: details.taxpayerRegistrationRegion || '',
            phone: details.contactPhone || '',
            email: ''
          };
        }
        break;
    }

    console.log('Organization info:', orgInfo);

    // IMPORTANT: Convert salesIds to string for SQL query
    const salesIdsString = numericSalesIds.join(',');
    console.log('Sales IDs string for SQL:', salesIdsString);

    // Fetch selected sales using raw SQL - FIXED QUERY
    const salesQuery = `
      SELECT 
        s.*,
        c.currencySymbol,
        c.currencyName
      FROM tbl_sales AS s
      LEFT JOIN Currency AS c ON s.currency = c.currencyId
      WHERE s.sales_id IN (${salesIdsString})
        AND s.organization_id = ${organizationId}
      ORDER BY s.sales_date ASC
    `;
    
    console.log('Sales SQL Query:', salesQuery);
    
    const sales = await prisma.$queryRawUnsafe(salesQuery);
    
    console.log(`Found ${sales.length} sales records`);
    console.log('Sales details:', sales);

    if (!sales.length) {
      console.log('No sales found for given IDs');
      return NextResponse.json(
        { message: "No sales found" },
        { status: 404 }
      );
    }

    // Get all items from selected sales using raw SQL
    const itemsQuery = `
      SELECT 
        si.*,
        u.name as unit_name
      FROM tbl_sales_items AS si
      LEFT JOIN Unit AS u ON si.unit_of_measurement_id = u.id
      WHERE si.sales_id IN (${salesIdsString})
      ORDER BY si.goods_service_name ASC
    `;
    
    console.log('Items SQL Query:', itemsQuery);
    
    const items = await prisma.$queryRawUnsafe(itemsQuery);

    console.log(`Found ${items.length} items`);
    console.log('First few items:', items.slice(0, 5));

    // Group items by product name and sum quantities
    const groupedItems = items.reduce((acc, item) => {
      const key = item.goods_service_name;
      if (!acc[key]) {
        acc[key] = {
          description: item.goods_service_name,
          unit: item.unit_name || 'Pcs',
          quantity: 0,
          discount: 0,
          sale_amount: 0,
          gst_amount: 0,
          total_amount: 0
        };
      }
      
      acc[key].quantity += parseFloat(item.quantity) || 0;
      acc[key].discount += parseFloat(item.discount) || 0;
      acc[key].sale_amount += parseFloat(item.amount_after_discount) || 0;
      acc[key].gst_amount += parseFloat(item.gst_amount) || 0;
      acc[key].total_amount += parseFloat(item.goods_service_total_amount) || 0;
      
      return acc;
    }, {});

    const groupedItemsArray = Object.values(groupedItems);
    console.log('Grouped items count:', groupedItemsArray.length);
    console.log('Grouped items:', groupedItemsArray);

    // Calculate totals from all selected sales
    const totals = sales.reduce((acc, sale) => {
      acc.taxable += parseFloat(sale.taxable_amount) || 0;
      acc.exempt += parseFloat(sale.exempt_amount) || 0;
      acc.gst += parseFloat(sale.gst_amount) || 0;
      acc.total_invoice += parseFloat(sale.total_invoice_amount) || 0;
      return acc;
    }, { taxable: 0, exempt: 0, gst: 0, total_invoice: 0 });

    console.log('Calculated totals:', totals);

    const subtotalBeforeGST = totals.taxable + totals.exempt;
    const currency = sales[0]?.currencySymbol || 'Nu.';
    
    console.log('Currency:', currency);
    console.log('Subtotal before GST:', subtotalBeforeGST);
    console.log('Invoice count:', sales.length);

    // Generate HTML
    const html = generateGSTStatementHTML({
      organization: orgInfo,
      period: { from: fromDate, to: toDate },
      items: groupedItemsArray,
      totals: totals,
      currency: currency,
      invoiceCount: sales.length,
      currentDate: new Date().toISOString().split('T')[0],
      subtotalBeforeGST: subtotalBeforeGST
    });

    console.log('=== API DEBUG END ===');

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="GST-Statement-${fromDate}-to-${toDate}.pdf"`
      }
    });

  } catch (error) {
    console.error("Error generating GST statement:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// Also keep the GET method for backward compatibility
export async function GET(request) {
  try {
    const organizationId = await getOrganizationIdFromRequest(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const salesIdsParam = searchParams.get('salesIds');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!salesIdsParam || !fromDate || !toDate) {
      return NextResponse.json(
        { message: "Missing parameters. salesIds, fromDate, and toDate are required." },
        { status: 400 }
      );
    }

    const salesIds = salesIdsParam.split(',').map(id => parseInt(id.trim()));
    
    // Call the same logic as POST
    const body = { salesIds, fromDate, toDate };
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body)
    });
    
    return POST(mockRequest);
    
  } catch (error) {
    console.error("Error in GET method:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
function generateGSTStatementHTML(data) {
  const { organization, period, items, totals, currency, invoiceCount, currentDate, subtotalBeforeGST } = data;

  // Format date function (DD-MMM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Format date for QR code (YYYY-MM-DD)
  const formatDateForQR = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateString;
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

    const number = Math.floor(num);
    if (number === 0) return 'Zero';

    let words = '';

    // Handle thousands
    if (number >= 1000) {
      const thousands = Math.floor(number / 1000);
      words += numberToWords(thousands) + ' Thousand';
      const remainder = number % 1000;
      if (remainder > 0) {
        words += ' ' + numberToWords(remainder);
      }
      return words.trim();
    }

    // Handle hundreds
    if (number >= 100) {
      words += ones[Math.floor(number / 100)] + ' Hundred';
      const remainder = number % 100;
      if (remainder > 0) {
        words += ' ' + numberToWords(remainder);
      }
      return words.trim();
    }

    // Handle tens
    if (number >= 20) {
      words += tens[Math.floor(number / 10)];
      const remainder = number % 10;
      if (remainder > 0) {
        words += ' ' + ones[remainder];
      }
      return words.trim();
    }

    // Handle teens
    if (number >= 10) {
      return teens[number - 10];
    }

    // Handle ones
    return ones[number];
  };

  // QR code data
  const qrData = JSON.stringify({
    statementType: "GST Statement",
    periodFrom: formatDateForQR(period.from),
    periodTo: formatDateForQR(period.to),
    issuedBy: organization.name,
    supplierTpn: organization.tpn,
    totalAmount: totals.total_invoice,
    invoiceCount: invoiceCount
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GST Statement</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      font-size: 14px;
      background-color: #ffffff;
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

    .taxpayer-block {
      line-height: 1.6;
      margin-top: 10px;
    }

    .period-block {
      text-align: right;
      line-height: 1.6;
    }

    .qr-block {
      text-align: center;
      margin-top: -20px;
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
      margin: 10px 0 10px 0;
      font-weight: bold;
    }

    .period-info {
      margin: 5px 0 10px 0;
      font-weight: bold;
      margin-top:-50px;
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
      background-color: #ffffff;
      border-bottom: 2px solid #000;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
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

    .total-invoice-value {
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
    
    /* Invoice Container - solid white for clean PDF capture */
    .invoice-container {
      width: 794px;
      min-height: 1123px;
      background: #ffffff;
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

  <div class="invoice-container" id="gst-statement-content">
    <h1 style="border-top: 2px solid black;
    border-bottom: 2px solid black;
    line-height: 57px;">GST Statement</h1>
   

    <!-- Date -->
    <div class="top-row">
      <div>
        <span class="label-bold">Date:</span>
        ${formatDate(currentDate)}
      </div>
    </div>

    <!-- Taxpayer + QR -->
    <div class="top-row">
      <div class="taxpayer-block">
        ${organization?.name ? `<span class="label-bold">Taxpayer Name:</span> ${organization.name}<br>` : ''}
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

    <!-- Period and Currency -->
    <div class="period-info">
      Period: From: ${formatDate(period.from)} To: ${formatDate(period.to)}
    </div>

    <div class="currency">Currency: ${currency}</div>

    <!-- ITEMS TABLE - Grouped by product -->
    <table>
      <thead>
        <tr>
          <th>SL No.</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit</th>
          <th>Discount</th>
          <th>Sale Amount</th>
          <th>GST Amount</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.description || ''}</td>
            <td class="text-center">${formatCurrency(parseFloat(item.quantity))}</td>
            <td class="text-center">${item.unit || 'Pcs'}</td>
            <td class="text-right"> ${formatCurrency(parseFloat(item.discount))}</td>
            <td class="text-right"> ${formatCurrency(parseFloat(item.sale_amount))}</td>
            <td class="text-right"> ${formatCurrency(parseFloat(item.gst_amount))}</td>
            <td class="text-right"> ${formatCurrency(parseFloat(item.total_amount))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- TOTALS - Updated to match screenshot -->
    <div class="totals">
      <div><span>Total Amount:</span> ${currency} ${formatCurrency(totals.total_invoice)}</div>
      <div><span>Exempt Amount:</span> ${currency} ${formatCurrency(totals.exempt)}</div>
      <div><span>Taxable Amount:</span> ${currency} ${formatCurrency(totals.taxable)}</div>
      <div><span>GST @5%:</span> ${currency} ${formatCurrency(totals.gst)}</div>
    </div>

    <!-- FINAL TOTAL -->
    <div class="total-invoice-value">
      Total Invoice Value: ${currency} ${formatCurrency(totals.total_invoice)}
    </div>

    <div class="words">
      Amount in Words: ${numberToWords(totals.total_invoice)} ${currency.replace('.', '')} Only
    </div>

    <!-- DECLARATION -->
    <div class="declaration">
      <div>Declaration: I/We certify that the particulars are true.</div>
      <div>Authorized Signature: _____________________</div>
      
    </div>
  </div>

  <!-- Action Buttons Below Statement -->
  <div class="button-container">
    <div style="position: relative;">
      <button class="print-options-button" id="printOptionsBtn" onclick="togglePrintOptions()">
        🖨️ Print Options
      </button>
      <div class="print-options-dropdown" id="printOptionsDropdown">
        <div class="print-option-item" onclick="printInvoice('A4')">A4</div>
        <div class="print-option-item" style="display:none;" onclick="printInvoice('A5')">A5</div>
        <div class="print-option-item" style="display:none;" onclick="printInvoice('Bill')">Bill Format</div>
      </div>
    </div>
    <button class="pdf-button" id="pdfBtn" onclick="downloadPDF()">
      <span id="pdfBtnText">📥 Download PDF</span>
      <span id="pdfBtnSpinner" style="display: none; margin-left: 8px;">
        <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span>
      </span>
    </button>
    <a href="/gst-statement" class="close-button">
      ❌ Close
    </a>
  </div>

  <!-- QR Code Library -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
  <!-- PDF Generation Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    // QR Code Generation
    const qrText = JSON.stringify({
      statementType: "GST Statement",
      date: '${formatDateForQR(currentDate)}',
      periodFrom: '${formatDateForQR(period.from)}',
      periodTo: '${formatDateForQR(period.to)}',
      issuedBy: "${organization.name}",
      supplierTpn: '${organization.tpn}',
      totalAmount: '${totals.total_invoice}',
      invoiceCount: '${invoiceCount}'
    });

    document.addEventListener('DOMContentLoaded', function() {
      const qrcodeElement = document.getElementById('qrcode');
      qrcodeElement.innerHTML = '';
      
      try {
        // Try with medium error correction level
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
          // Fallback to low error correction level
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
            const compactQrText = JSON.stringify({
              stmt: 'GST',
              from: '${formatDateForQR(period.from)}',
              to: '${formatDateForQR(period.to)}',
              amt: '${totals.total_invoice}',
              tpn: '${organization.tpn}'
            });
            
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
      
      const svg = qrcodeElement.querySelector('svg');
      if (svg) {
        svg.style.border = 'none';
        svg.style.background = '#fff';
        svg.style.width = '120px';
        svg.style.height = '120px';
        svg.style.display = 'block';
        svg.style.margin = '0 auto';
      }
    });

    // Print Options
    function togglePrintOptions() {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.toggle('show');
    }

    function printInvoice(format) {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.remove('show');
      
      // Set print styles based on format
      const style = document.createElement('style');
      switch(format) {
        case 'A4':
          style.textContent = \`
            @media print {
              .invoice-container { 
                width: 210mm; 
                padding: 20mm;
              }
            }
          \`;
          break;
        case 'A5':
          style.textContent = \`
            @media print {
              .invoice-container { 
                width: 148mm; 
                padding: 15mm;
                font-size: 12px;
              }
            }
          \`;
          break;
        case 'Bill':
          style.textContent = \`
            @media print {
              .invoice-container { 
                width: 80mm; 
                padding: 5mm;
                font-size: 10px;
              }
              table { font-size: 9px; }
              h1 { font-size: 18px; }
            }
          \`;
          break;
      }
      
      document.head.appendChild(style);
      window.print();
      setTimeout(() => {
        document.head.removeChild(style);
      }, 100);
    }

    // PDF Download Function
    async function downloadPDF() {
      const statementElement = document.getElementById('gst-statement-content');
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
        
        // Convert HTML to canvas - scale 1.25 + white background for sharp, single-tone PDF
        const canvas = await html2canvas(statementElement, {
          scale: 1.25,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: function(clonedDoc, clonedElement) {
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedElement.style.backgroundColor = '#ffffff';
          }
        });

        // Show downloading state
        pdfBtnText.textContent = '⬇️ Downloading...';
        
        // JPEG quality 0.92 for clear text, minimal haziness (still under ~1MB for typical statements)
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        
        // Save the PDF
        pdf.save('GST-Statement-${period.from}-to-${period.to}.pdf');
        
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