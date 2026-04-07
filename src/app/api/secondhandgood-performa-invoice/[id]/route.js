import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const secondHandSalesId = Number(params.id);
    
    if (isNaN(secondHandSalesId)) {
      return NextResponse.json({ 
        message: "Invalid second hand sales ID format" 
      }, { status: 400 });
    }

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

    /* ---------------- SECOND HAND SALES WITH RELATIONS ---------------- */
    const secondHandSale = await prisma.secondHandSale.findUnique({
      where: { 
        second_hand_sales_id: secondHandSalesId 
      },
      include: {
        items: {
          include: {
            unit: true,
            goods: true,
            service: true,
          }
        },
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true,
          }
        },
        currency_info: true,
        organization: {
          include: {
            businessDetails: true,
            governmentAgencyDetail: true,
            corporationDetail: true,
            csoDetail: true,
          }
        },
      }
    });

    if (!secondHandSale) {
      return NextResponse.json({ 
        message: `Second Hand Sale with ID ${secondHandSalesId} not found` 
      }, { status: 404 });
    }

    /* ---------------- EXTRACT CUSTOMER INFO ---------------- */
    let customerInfo = {};
    let customerDisplayName = "";
    let customerEmail = "";
    let customerPhone = "";
    let customerAddress = "";
    let customerRegistrationNo = "";

    const customer = secondHandSale.customer;
    
    if (customer) {
      customerRegistrationNo = secondHandSale.customer_tpn || "";
      customerDisplayName = secondHandSale.customer_name || "";
      
      switch (customer.partyType) {
        case "BUSINESS":
          if (customer.businessParty) {
            customerDisplayName = customer.businessParty.businessName || customerDisplayName;
            customerRegistrationNo = customer.businessParty.taxPayerRegNo || customerRegistrationNo;
            customerEmail = customer.businessParty.officeEmail || "";
            customerPhone = customer.businessParty.officePhone || "";
            customerAddress = customer.businessParty.address || "";
          }
          break;

        case "GOVERNMENT_AGENCY":
          if (customer.governmentAgencyParty) {
            customerDisplayName = customer.governmentAgencyParty.agencyName || customerDisplayName;
            customerRegistrationNo = customer.governmentAgencyParty.taxPayerRegNo || customerRegistrationNo;
            customerEmail = customer.governmentAgencyParty.officeEmail || "";
            customerPhone = customer.governmentAgencyParty.officePhone || "";
            customerAddress = customer.governmentAgencyParty.address || "";
          }
          break;

        case "CORPORATION":
          if (customer.corporationParty) {
            customerDisplayName = customer.corporationParty.corporationName || customerDisplayName;
            customerRegistrationNo = customer.corporationParty.taxPayerRegNo || customerRegistrationNo;
            customerEmail = customer.corporationParty.officeEmail || "";
            customerPhone = customer.corporationParty.officePhone || "";
            customerAddress = customer.corporationParty.address || "";
          }
          break;

        case "CSO":
          if (customer.csoParty) {
            customerDisplayName = customer.csoParty.csoName || customerDisplayName;
            customerRegistrationNo = customer.csoParty.taxPayerRegNo || customerRegistrationNo;
            customerEmail = customer.csoParty.officeEmail || "";
            customerPhone = customer.csoParty.officePhone || "";
            customerAddress = customer.csoParty.address || "";
          }
          break;

        case "INDIVIDUAL":
          if (customer.individualParty) {
            customerDisplayName = secondHandSale.customer_name || customer.individualParty.name || "Individual";
            customerRegistrationNo = customer.individualParty.taxPayerRegNo || customerRegistrationNo;
            customerEmail = customer.individualParty.email || "";
            customerPhone = customer.individualParty.phone || "";
            customerAddress = customer.individualParty.address || "";
          }
          break;
      }
    }

    /* ---------------- EXTRACT ORGANIZATION INFO ---------------- */
    let orgName = "";
    let orgCode = "";
    let orgAddress = "";
    let orgPhone = "";
    let orgEmail = '';

    const org = secondHandSale.organization;

    if (org) {
      switch (org.orgType) {
        case 'business':
          const businessDetails = org.businessDetails;
          if (businessDetails) {
            orgName = businessDetails.businessName || '';
            orgCode = businessDetails.taxpayerNumber || '';
            orgAddress = parseAddressFromJson(businessDetails.businessLocationJson);
            orgPhone = businessDetails.officePhone || '';
            orgEmail = businessDetails.officeEmail || '';
          }
          break;

        case 'government':
          const govDetails = org.governmentAgencyDetail;
          if (govDetails) {
            orgName = govDetails.agencyName || '';
            orgCode = govDetails.tpn || '';
            orgAddress = govDetails.taxpayerRegistrationRegion || '';
            orgPhone = govDetails.contactPhone || '';
            orgEmail = govDetails.contactEmail || '';
          }
          break;

        case 'corporation':
          const corpDetails = org.corporationDetail;
          if (corpDetails) {
            orgName = corpDetails.corporationName || '';
            orgCode = corpDetails.tpn || '';
            orgAddress = corpDetails.taxpayerRegistrationRegion || '';
            orgPhone = corpDetails.contactPhone || '';
            orgEmail = corpDetails.contactEmail || '';
          }
          break;

        case 'cso':
          const csoDetails = org.csoDetail;
          if (csoDetails) {
            orgName = csoDetails.agencyName || '';
            orgCode = csoDetails.tpn || '';
            orgAddress = csoDetails.taxpayerRegistrationRegion || '';
            orgPhone = csoDetails.contactPhone || '';
            orgEmail = csoDetails.contactEmail || '';
          }
          break;
      }
    }

    /* ---------------- FORMAT SALES ITEMS ---------------- */
    const formattedItems = secondHandSale.items.map(item => ({
      second_hand_sales_item_id: item.second_hand_sales_item_id,
      second_hand_sales_id: item.second_hand_sales_id,
      sales_item_type: item.sales_item_type,
      goods_service_name: item.goods_service_name,
      goods_service_description: item.goods_service_description,
      unit_price: item.unit_price,
      quantity: item.quantity,
      amount: item.amount,
      discount: item.discount,
      amount_after_discount: item.amount_after_discount,
      gst_percentage: item.gst_percentage,
      gst_amount: item.gst_amount,
      goods_service_total_amount: item.goods_service_total_amount,
      unit_name: item.unit?.name || 'Unit',
      goods_name: item.goods?.goodsName || '',
      service_name: item.service?.service_name || ''
    }));

    // Get GST percentage from first item or default to 5%
    const gstPercentage = formattedItems.length > 0 ? formattedItems[0]?.gst_percentage || 5 : 5;

    /* ---------------- GENERATE HTML ---------------- */
    const html = generateSecondHandInvoiceHTML({
      salesId: secondHandSalesId,
      sales: {
        second_hand_sales_id: secondHandSale.second_hand_sales_id,
        sales_invoice_no: secondHandSale.sales_invoice_no,
        sales_date: secondHandSale.sales_date,
        sales_amount: secondHandSale.sales_amount,
        exempt_amount: secondHandSale.exempt_amount,
        taxable_amount: secondHandSale.taxable_amount,
        gst_amount: secondHandSale.gst_amount,
        total_invoice_amount: secondHandSale.total_invoice_amount,
        created_on: secondHandSale.created_on,
        currencyName: secondHandSale.currency_info?.currencyName || 'BTN',
        currencySymbol: secondHandSale.currency_info?.currencySymbol || 'Nu.',
        payment_mode: secondHandSale.payment_mode,
        transaction_id: secondHandSale.transaction_id,
        cheque_number: secondHandSale.cheque_number,
        journal_number: secondHandSale.journal_number,
        bank_name: secondHandSale.bank_name
      },
      items: formattedItems,
      customer: {
        name: customerDisplayName,
        tpn: customerRegistrationNo,
        address: customerAddress,
        email: customerEmail,
        phone: customerPhone
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
        'Content-Disposition': `inline; filename="second-hand-invoice-${secondHandSale.sales_invoice_no || secondHandSalesId}.html"`
      }
    });

  } catch (error) {
    console.error("Full error details:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

function generateSecondHandInvoiceHTML(data) {
  const { salesId, sales, items, customer, organization, gstPercentage } = data;

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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${sales.sales_invoice_no || 'SH-INV/2025/001'}</title>

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
    
    .second-hand-notice {
      text-align: center;
      font-weight: bold;
      margin: 20px 0;
      font-size: 15px;
      color: #000;
      padding: 10px;
      
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-left {
      text-align: left;
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
    line-height: 57px;">Performa Invoice</h1>

    <!-- Invoice No + Date -->
    <div class="top-row">
      <div>
        <span class="label-bold">Invoice No.:</span>
        ${sales.sales_invoice_no || 'SH-INV/2025/001'}
      </div>

      <div>
        <span class="label-bold">Invoice Date:</span>
        ${formatDate(sales.sales_date)}
      </div>
    </div>

    <!-- Supplier + QR -->
    <div class="top-row">
      <div class="supplier-block" >
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
      ${customer?.name ? `<span class="label-bold">Customer Name:</span> ${customer.name}<br>` : ''}
      ${customer?.address ? `<span class="label-bold">Address:</span> ${customer.address}<br>` : ''}
      ${customer?.email ? `<span class="label-bold">Email:</span> ${customer.email}<br>` : ''}
      ${customer?.phone ? `<span class="label-bold">Phone:</span> ${customer.phone}<br>` : ''}
    </div>

   
    <div class="currency">Currency: ${sales.currencyName}</div>
    <div class="payment">
      Payment Mode: ${
        sales.payment_mode
          ? sales.payment_mode === 'CASH'
            ? 'Cash'

            : sales.payment_mode === 'PAYMENT_GATEWAY'
            ? `Payment Gateway (Txn ID: ${sales.transaction_id || 'N/A'})`

            : ['MBOB', 'MPAY', 'TPAY', 'DRUKPAY', 'EPAY', 'DK_BANK'].includes(
                sales.payment_mode
              )
            ? `${sales.payment_mode} (Journal No: ${sales.journal_number || 'N/A'})`

            : sales.payment_mode === 'CHEQUE'
            ? `Cheque (No: ${sales.cheque_number || 'N/A'}, Bank: ${
                sales.bank_name
                  ? sales.bank_name.replace(/_/g, ' ')
                  : 'N/A'
              })`

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
            <td class="text-center">${item.unit_name || 'Unit'}</td>
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

     <!-- Second Hand Goods Notice -->
    <div class="second-hand-notice">
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
    <a href="/secondhand-goods-sales" class="close-button">
      ❌ Close
    </a>
  </div>

  <script>
  window.__BILL_DATA__ = ${JSON.stringify({
    title: 'Performa Invoice',
    subtitle: '',
    invoiceNo: sales.sales_invoice_no || 'SH-INV/2025/001',
    invoiceDate: formatDate(sales.sales_date),
    supplierName: organization?.name || '',
    supplierTpn: organization?.tpn || '',
    supplierAddress: organization?.address || '',
    supplierPhone: organization?.phone || '',
    customerName: customer?.name || '',
    customerEmail: customer?.email || '',
    customerPhone: customer?.phone || '',
    customerAddress: customer?.address || '',
    currency: sales.currencyName || '',
    paymentMode: !sales.payment_mode ? 'N/A' : sales.payment_mode === 'CASH' ? 'Cash' : sales.payment_mode === 'PAYMENT_GATEWAY' ? ('Payment Gateway (Txn ID: ' + (sales.transaction_id || 'N/A') + ')') : ['MBOB','MPAY','TPAY','DRUKPAY','EPAY','DK_BANK'].includes(sales.payment_mode) ? (sales.payment_mode + ' (Journal No: ' + (sales.journal_number || 'N/A') + ')') : sales.payment_mode === 'CHEQUE' ? ('Cheque (No: ' + (sales.cheque_number || 'N/A') + ', Bank: ' + (sales.bank_name ? String(sales.bank_name).replace(/_/g, ' ') : 'N/A') + ')') : 'N/A',
    items: items.map((item, i) => ({ sl: i + 1, desc: item.goods_service_name || '', qty: item.quantity || '', u: item.unit_name || 'Unit', rate: formatCurrency(item.unit_price), disc: formatCurrency(item.discount), saleAmount: formatCurrency(item.amount_after_discount) })),
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
    // QR Code Data for Second Hand Invoice
    const qrText = [
      'invoiceNo: ${sales.sales_invoice_no}',
      'invoiceDate: ${formatDateForQR(sales.sales_date)}',
      'supplierTpn: ${organization.tpn || ""}',
      'totalAmount: ${sales.total_invoice_amount}',
      'verificationUrl: ',
      'invoiceType: original',
      'issuedBy: ${organization.name}',
      'goodType: Second Hand Goods'
    ].join('\\n');

    function generateQRCode(elementId, size) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.innerHTML = '';
      try {
        const qrcode = new QRCode({
          content: qrText,
          padding: 2,
          width: size,
          height: size,
          color: "#000000",
          background: "#ffffff",
          ecl: "M"
        });
        el.innerHTML = qrcode.svg();
        const svg = el.querySelector('svg');
        if (svg) {
          svg.style.border = 'none';
          svg.style.background = '#fff';
          svg.style.width = size + 'px';
          svg.style.height = size + 'px';
          svg.style.display = 'block';
          svg.style.margin = '0 auto';
        }
      } catch (e) {
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
          el.innerHTML = qrcode.svg();
          const svg = el.querySelector('svg');
          if (svg) {
            svg.style.border = 'none';
            svg.style.background = '#fff';
            svg.style.width = size + 'px';
            svg.style.height = size + 'px';
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
          }
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }
    }

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
              inv: "${sales.sales_invoice_no || 'SH-INV/2025/001'}",
              date: "${formatDateForQR(sales.sales_date)}",
              amt: "${sales.total_invoice_amount || '0.00'}",
              tpn: "${organization.tpn || ''}",
              type: "Second Hand"
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
      
      generateQRCode('qrcode-bottom-content', 50);
    });

    // Toggle print options dropdown
    function togglePrintOptions() {
      const dropdown = document.getElementById('printOptionsDropdown');
      dropdown.classList.toggle('show');
    }

    // Print invoice
    function printInvoice(format) {
      document.getElementById('printOptionsDropdown').classList.remove('show');
      const invoiceContainer = document.getElementById('invoice-content');
      invoiceContainer.classList.remove('print-a4-format', 'print-a5-format', 'print-bill-format');
      
      const existingStyle = document.getElementById('print-format-style');
      if (existingStyle) existingStyle.remove();
      
      if (format === 'A4') {
        invoiceContainer.classList.add('print-a4-format');
        const style = document.createElement('style');
        style.id = 'print-format-style';
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
        document.head.appendChild(style);
        window.print();
        setTimeout(function() {
          style.remove();
          invoiceContainer.classList.remove('print-a4-format');
        }, 100);
        return;
      }
      
      if (format === 'A5') {
        invoiceContainer.classList.add('print-a5-format');
        const style = document.createElement('style');
        style.id = 'print-format-style';
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
        document.head.appendChild(style);
        window.print();
        setTimeout(function() {
          style.remove();
          invoiceContainer.classList.remove('print-a5-format');
        }, 100);
        return;
      }
      
      if (format === 'Bill') {
        buildBillPDFWithJSPDF();
        return;
      }
      
      window.print();
    }

    // Bill PDF: fast path using jsPDF only (no html2canvas)
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
        
        // Convert canvas to PDF (JPEG 0.92 + SLOW = same quality as other invoice PDFs, no bluish)
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'SLOW');
        
        // Save the PDF
        const fileName = 'second-hand-invoice-' + ('${sales.sales_invoice_no || salesId}').replace(/[^a-z0-9]/gi, '_') + '.pdf';
        pdf.save(fileName);
        
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