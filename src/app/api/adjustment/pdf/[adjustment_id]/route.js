import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const adjustmentId = Number(params.adjustment_id);

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

    /* ---------------- ADJUSTMENT ---------------- */
    const adjustmentResult = await prisma.$queryRaw`
      SELECT 
        a.adjustment_id,
        a.adjustment_note_no,
        a.date,
        a.organization_id,
        a.customer_id,
        a.sale_id,
        a.invoice_no,
        a.sales_amount,
        a.exempt_amount,
        a.taxable_amount,
        a.gst_amount,
        a.total_invoice_amount,
        a.total_adjustment_amount,
        a.effect_on_gst_payable,
        a.adjustment_amount,
        a.adjustment_type,
        a.status,
        a.created_by,
        a.created_on
      FROM tbl_adjustment AS a
      WHERE a.adjustment_id = ${adjustmentId}
      LIMIT 1
    `;

    if (!adjustmentResult.length) {
      return NextResponse.json({ message: "Adjustment not found" }, { status: 404 });
    }

    const adjustment = adjustmentResult[0];

    /* ---------------- ADJUSTMENT ITEMS ---------------- */
    const adjustmentItems = await prisma.$queryRaw`
      SELECT 
        ai.adjustment_item_id,
        ai.adjustment_id,
        ai.sales_item_type,
        ai.goods_service_name,
        ai.goods_service_description,
        ai.unit_price,
        ai.quantity,
        ai.amount,
        ai.unit_of_measurement_id,
        u.name as unit_name,
        ai.discount,
        ai.amount_after_discount,
        ai.gst_percentage,
        ai.gst_amount,
        ai.goods_service_total_amount,
        ai.reason_for_adjustment,
        ai.adjustment_type,
        ai.adjustment_amount
      FROM tbl_adjustment_items AS ai
      LEFT JOIN Unit AS u ON u.id = ai.unit_of_measurement_id
      WHERE ai.adjustment_id = ${adjustment.adjustment_id}
    `;

    /* ---------------- SALES DETAILS ---------------- */
    let sales = null;
    let currencyName = 'Nu.';
    if (adjustment.sale_id) {
      const salesResult = await prisma.$queryRaw`
    SELECT 
      s.sales_id,
      s.sales_invoice_no,
      s.sales_date,
      s.customer_name,
      s.sales_amount,
        s.exempt_amount,
        s.taxable_amount,
        s.gst_amount,
        s.total_invoice_amount,
      s.currency  -- ADD THIS LINE
    FROM tbl_sales AS s
    WHERE s.sales_id = ${adjustment.sale_id}
    LIMIT 1
  `;

      console.log("Sales result:", salesResult);
      console.log("Query executed for sale_id:", adjustment.sale_id);

      if (salesResult.length) {
        sales = salesResult[0];
        console.log("Parsed sales object:", sales);
        console.log("Sales currency value:", sales.currency);
        console.log("Type of currency:", typeof sales.currency);

        if (sales.currency) {
          console.log("Currency ID exists:", sales.currency);
          console.log("Fetching currency name from currency table...");

          const currencyResult = await prisma.$queryRaw`
        SELECT 
          c.currencyName,
          c.currencySymbol
        FROM Currency AS c
        WHERE c.currencyId = ${sales.currency}
        LIMIT 1
      `;

          console.log("Currency query result:", currencyResult);

          if (currencyResult.length) {
            currencyName = currencyResult[0].currencyName;
            console.log("Found currency name:", currencyName);
            console.log("Currency symbol:", currencyResult[0].currencySymbol);
          } else {
            console.log("WARNING: No currency found for ID:", sales.currency);
            console.log("Using default currency name:", currencyName);
          }
        } else {
          console.log("WARNING: sales.currency is null or undefined");
          console.log("Using default currency name:", currencyName);
        }
      } else {
        console.log("ERROR: No sales found for sale_id:", adjustment.sale_id);
        console.log("Using default currency name:", currencyName);
      }
    } else {
      console.log("No sale_id provided in adjustment");
      console.log("Using default currency name:", currencyName);
    }

    /* ---------------- PARTY (CUSTOMER) ---------------- */
    const partyResult = await prisma.$queryRaw`
      SELECT *
      FROM Party
      WHERE partyId = ${adjustment.customer_id}
      LIMIT 1
    `;

    let party = null;
    let partyDetails = {};
    let partyDisplayName = "";
    let partyEmail = "";
    let partyPhone = "";
    let partyAddress = "";
    let partyRegistrationNo = "";

    if (partyResult.length) {
      party = partyResult[0];

      // Get party details based on type
      switch (party.partyType) {
        case "BUSINESS":
          partyDetails = (
            await prisma.$queryRaw`
              SELECT * FROM BusinessParty WHERE partyId = ${party.partyId} LIMIT 1
            `
          )[0];
          partyDisplayName = partyDetails?.businessName || sales?.customer_name || "Business";
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
          partyDisplayName = partyDetails?.corporationName || sales?.customer_name || "Corporation";
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
          partyDisplayName = partyDetails?.csoName || sales?.customer_name || "CSO";
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
          partyDisplayName = sales?.customer_name || "Individual";
          partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
          partyEmail = partyDetails?.email || "";
          partyPhone = partyDetails?.phone || "";
          partyAddress = partyDetails?.address || "";
          break;
      }
    }

    /* ---------------- ORGANIZATION (SUPPLIER) ---------------- */
    const orgResult = await prisma.$queryRaw`
      SELECT *
      FROM Organization
      WHERE id = ${adjustment.organization_id}
      LIMIT 1
    `;

    let org = null;
    let orgDetails = {};
    let orgName = '';
    let orgCode = '';
    let orgAddress = '';
    let orgPhone = '';
    let orgEmail = '';

    if (orgResult.length) {
      org = orgResult[0];

      switch (org.orgType) {
        case 'business':
          orgDetails = (
            await prisma.$queryRaw`
              SELECT * FROM BusinessDetails
              WHERE organizationId = ${org.id}
              LIMIT 1
            `
          )[0];
          orgName = orgDetails?.businessName || '';
          orgCode = orgDetails?.businessNameCode || '';
          orgAddress = parseAddressFromJson(orgDetails?.businessLocationJson);
          orgPhone = orgDetails?.officePhone || '';
          orgEmail = orgDetails?.officeEmail || '';
          break;

        case 'government':
          orgDetails = (
            await prisma.$queryRaw`
              SELECT * FROM GovernmentAgencyDetails
              WHERE organizationId = ${org.id}
              LIMIT 1
            `
          )[0];
          orgName = orgDetails?.agencyName || '';
          orgCode = orgDetails?.agencyCode || '';
          orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
          orgPhone = orgDetails?.contactPhone || '';
          orgEmail = orgDetails?.contactEmail || '';
          break;

        case 'corporation':
          orgDetails = (
            await prisma.$queryRaw`
              SELECT * FROM CorporationDetails
              WHERE organizationId = ${org.id}
              LIMIT 1
            `
          )[0];
          orgName = orgDetails?.corporationName || '';
          orgCode = orgDetails?.organizationCode || '';
          orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
          orgPhone = orgDetails?.contactPhone || '';
          orgEmail = orgDetails?.contactEmail || '';
          break;

        case 'cso':
          orgDetails = (
            await prisma.$queryRaw`
              SELECT * FROM CsoDetails
              WHERE organizationId = ${org.id}
              LIMIT 1
            `
          )[0];
          orgName = orgDetails?.agencyName || '';
          orgCode = orgDetails?.agencyCode || '';
          orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
          orgPhone = orgDetails?.contactPhone || '';
          break;
      }
    }

    /* ---------------- GENERATE HTML ---------------- */
    const html = generateAdjustmentNoteHTML({
      adjustmentId: adjustmentId,
      adjustment: adjustment,
      items: adjustmentItems,
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
      sales: sales,
      currencyName: currencyName
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="adjustment-${adjustment.adjustment_note_no || adjustmentId}.html"`
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

function generateAdjustmentNoteHTML(data) {
  const { adjustmentId, adjustment, items, party, organization, sales, currencyName } = data;

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

  // Determine adjustment note type
  const getAdjustmentNoteType = () => {
    return "Original"; // Based on your requirement
  };

  // Generate verification URL
  const getVerificationUrl = (adjustmentNoteNo) => {
    if (!adjustmentNoteNo) return 'https://gst.drcs.bt/verify/ADN2025001';
    // Clean the adjustment note number for URL
    const cleanNoteNo = adjustmentNoteNo.replace(/\//g, '');
    return `https://gst.drcs.bt/verify/${cleanNoteNo}`;
  };

  // QR Code data will be generated in the script section

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Adjustment Note - ${adjustment.adjustment_note_no || 'ADN/2025/001'}</title>

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

    /* Two Column Section */
    .two-column-section {
      margin: 40px 0;
    }

    .two-column-header {
      font-weight: bold;
      text-align: center;
      margin-bottom: 15px;
    }

    .two-column-container {
      display: flex;
      justify-content: space-between;
    }

    .column {
      width: 48%;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }

    .amount-row:last-child {
      border-bottom: none;
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

  <div class="invoice-container" id="adjustment-content">
    <h1 style="border-top: 2px solid black;
    border-bottom: 2px solid black;
    line-height: 57px;">Adjustment Note</h1>
    <div class="sub-title">${getAdjustmentNoteType()}</div>

    <!-- Adjustment Note No + Date -->
    <div class="top-row">
      <div>
        <span class="label-bold">Adjustment Note No.:</span>
        ${adjustment.adjustment_note_no || 'ADN/2025/001'}
      </div>

      <div>
        <span class="label-bold">Adjustment Note Date:</span>
        ${formatDate(adjustment.date)}
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
    <div class="customer-block" style="margin-top:-80px">
      ${party?.name ? `<span class="label-bold">Customer Name:</span> ${party.name}<br>` : ''}
      ${party?.tpn ? `<span class="label-bold">TPN:</span> ${party.tpn}<br>` : ''}
      ${party?.address ? `<span class="label-bold">Address:</span> ${party.address}<br>` : ''}
      ${party?.email ? `<span class="label-bold">Email:</span> ${party.email}<br>` : ''}
      ${party?.phone ? `<span class="label-bold">Phone:</span> ${party.phone}<br>` : ''}
    </div>

    <!-- Original Invoice Details -->
    ${sales ? `
    <div class="customer-block" style="margin-top: 20px;">
      <span class="label-bold">Original Invoice No:</span> ${sales.sales_invoice_no || ''}<br>
      <span class="label-bold">Original Invoice Date:</span> ${formatDate(sales.sales_date)}
    </div>
    ` : ''}

    <div class="currency">Currency: ${currencyName}</div>

    <!-- ADJUSTMENT ITEMS TABLE -->
    <table>
      <thead>
        <tr>
          <th>Sl. No.</th>
          <th>Description</th>
          <th>Unit</th>
          <th>Quantity</th>
          <th>Sale Amount</th>
          <th>GST Amount</th>
          <th>Total Amount</th>
        </tr>
      </thead>

      <tbody>
        ${items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.goods_service_name || ''}</td>
            <td>${item.unit_name || ''}</td>
            <td>${item.quantity || '0.00'}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td>${formatCurrency(item.gst_amount)}</td>
            <td>${formatCurrency(item.goods_service_total_amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>


        <div class="two-column-section">
      
      <div class="two-column-container">
        <!-- Left Column -->
        <div class="column">
        <div class="amount-row">
            <span>Original Sale Amount</span>
            <span>${formatCurrency(sales.sales_amount || 0)}</span>
          </div>

          <div class="amount-row">
            <span>Original Exempt Amount</span>
            <span>${formatCurrency(sales.exempt_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>Original Taxable Amount</span>
            <span>${formatCurrency(sales.taxable_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>Original GST Amount</span>
            <span>${formatCurrency(sales.gst_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>Original Total Invoice Amount</span>
            <span>${formatCurrency(sales.total_invoice_amount || 0)}</span>
          </div>
        </div>

        <!-- Right Column -->
        <div class="column">
        <div class="amount-row">
            <span>New Sale Amount</span>
            <span>${formatCurrency(adjustment.sales_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>New Exempt Amount</span>
            <span>${formatCurrency(adjustment.exempt_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>New Taxable Amount</span>
            <span>${formatCurrency(adjustment.taxable_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>New GST Amount</span>
            <span>${formatCurrency(adjustment.gst_amount || 0)}</span>
          </div>
          <div class="amount-row">
            <span>New Total Invoice Amount</span>
            <span>${formatCurrency(adjustment.total_invoice_amount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- TOTALS -->
    <div class="totals">
      <div>
        <span>
          Adjustment Amount: ${formatCurrency(
    (Number(adjustment.gst_amount) || 0) -
    (Number(sales.gst_amount) || 0)
  )
    }
        </span>
      </div>
      <div>
        <span>Adjustment Type: ${adjustment.adjustment_type}</span>
      </div>
    </div>


    <!-- DECLARATION -->
    <div class="declaration">
      <div>Declaration: I/We certify that the particulars given above are true and correct and that this Adjustment Note is issued in accordance with Rules 188–191 of the Bhutan GST Rules and Regulations.</div>
      <div>Authorized Signature: _____________________</div>
      <div>Place of Supply: ${organization.address}</div>
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
    <a href="/adjustment_list" class="close-button">
      ❌ Close
    </a>
  </div>

  <!-- QR Code Library -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
  <!-- PDF Generation Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <script>
    // Print options toggle function
    function togglePrintOptions() {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.toggle('show');
    }
    
    // Print invoice function (you can customize this based on your needs)
    function printInvoice(format) {
      // Close dropdown
      document.getElementById('printOptionsDropdown').classList.remove('show');
      
      // Add format-specific styles for printing if needed
      if (format === 'A5') {
        const style = document.createElement('style');
        style.innerHTML = '@media print { body { transform: scale(0.85); } }';
        document.head.appendChild(style);
      }
      
      // Trigger print
      window.print();
      
      // Remove temporary styles after print
      if (format === 'A5') {
        setTimeout(() => {
          const addedStyle = document.querySelector('style[media="print"]');
          if (addedStyle) addedStyle.remove();
        }, 100);
      }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      const dropdown = document.getElementById('printOptionsDropdown');
      const button = document.getElementById('printOptionsBtn');
      
      if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    });

    const qrText = JSON.stringify({
      adjustmentNoteNo: '${adjustment.adjustment_note_no}',
      adjustmentNoteDate: '${formatDateForQR(adjustment.date)}',
      adjustmentNoteType: "Original",
      issuedBy: "${organization.name || ''}",
      supplierTpn: '${organization.tpn}',
      adjustmentAmount:(Number(${adjustment.gst_amount}) || 0) -  (Number(${sales.gst_amount}) || 0),
      verificationUrl: ""
    });
    const compactQrText = JSON.stringify({
      adjNo: '${adjustment.adjustment_note_no}',
      date: '${formatDateForQR(adjustment.date)}',
      amt: '${formatCurrency(adjustment.adjustment_amount)}',
      tpn: '${organization.tpn}'
    });

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
        svg.style.display = 'block';
        svg.style.margin = '0 auto';
      }
    });

    // PDF Download Function
    async function downloadPDF() {
      const adjustmentElement = document.getElementById('adjustment-content');
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
        const canvas = await html2canvas(adjustmentElement, {
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
        pdf.save('adjustment-${adjustment.adjustment_note_no || adjustmentId}.pdf');
        
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
</html>`;
}