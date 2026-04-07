import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    // FIX: Use params.id instead of params.purchase_id
    const purchaseId = Number(params.id);

    // Add debug logging
    console.log("Route params:", params);
    console.log("Purchase ID from params.id:", params.id);
    console.log("Purchase ID after conversion:", purchaseId);

    // Add validation
    if (isNaN(purchaseId)) {
      return NextResponse.json({
        message: "Invalid purchase ID format"
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

    /* ---------------- PURCHASE WITH RELATIONS ---------------- */
    console.log("Fetching purchase with ID:", purchaseId);

    const purchase = await prisma.purchase.findUnique({
      where: {
        purchase_id: purchaseId
      },
      include: {
        items: {
          include: {
            unitObject: true,
            goods: true,
            service: true
          }
        },
        supplier: true,
        dealer: true,
        currency_info: true,
        organization: {
          include: {
            businessDetails: true,
            governmentAgencyDetail: true,
            corporationDetail: true,
            csoDetail: true
          }
        }
      }
    });

    console.log("Purchase query result:", purchase ? "Found" : "Not found");

    if (!purchase) {
      return NextResponse.json({
        message: `Purchase with ID ${purchaseId} not found`
      }, { status: 404 });
    }

    /* ---------------- EXTRACT SUPPLIER INFO ---------------- */
    const supplierInfo = purchase.supplier ? {
      name: purchase.supplier.supplierName,
      tpn: purchase.supplier.taxpayerRegNo,
      email: purchase.supplier.contactEmail,
      phone: purchase.supplier.contactPhone,
      licenseNo: purchase.supplier.businessLicenseNo,
      address: purchase.supplier.location || ''
    } : {};

    console.log("Supplier info extracted:", supplierInfo.name);

    /* ---------------- EXTRACT DEALER INFO ---------------- */
    let dealerInfo = {};
    if (purchase.dealer) {
      dealerInfo = {
        name: purchase.dealer.dealerName,
        tpn: purchase.dealer.taxpayerRegNo,
        email: purchase.dealer.contactEmail,
        phone: purchase.dealer.contactPhone,
        licenseNo: purchase.dealer.businessLicenseNo,
        address: purchase.dealer.location || ''
      };
      console.log("Dealer info extracted:", dealerInfo.name);
    }

    /* ---------------- EXTRACT ORGANIZATION INFO ---------------- */
    let orgName = "";
    let orgCode = "";
    let orgAddress = "";
    let orgPhone = "";
    let orgEmail = '';

    const org = purchase.organization;
    console.log("Organization type:", org?.orgType);

    if (org) {
      switch (org.orgType) {
        case 'business':
          const businessDetails = org.businessDetails;
          if (businessDetails) {
            orgName = businessDetails.businessName || '';
            orgCode = businessDetails.businessNameCode || '';
            orgAddress = parseAddressFromJson(businessDetails.businessLocationJson);
            orgPhone = businessDetails.officePhone || '';
            orgEmail = businessDetails.officeEmail || '';
          }
          break;

        case 'government':
          const govDetails = org.governmentAgencyDetail;
          if (govDetails) {
            orgName = govDetails.agencyName || '';
            orgCode = govDetails.agencyCode || '';
            orgAddress = govDetails.taxpayerRegistrationRegion || '';
            orgPhone = govDetails.contactPhone || '';
            orgEmail = govDetails.contactEmail || '';
          }
          break;

        case 'corporation':
          const corpDetails = org.corporationDetail;
          if (corpDetails) {
            orgName = corpDetails.corporationName || '';
            orgCode = corpDetails.organizationCode || '';
            orgAddress = corpDetails.taxpayerRegistrationRegion || '';
            orgPhone = corpDetails.contactPhone || '';
            orgEmail = corpDetails.contactEmail || '';
          }
          break;

        case 'cso':
          const csoDetails = org.csoDetail;
          if (csoDetails) {
            orgName = csoDetails.agencyName || '';
            orgCode = csoDetails.agencyCode || '';
            orgAddress = csoDetails.taxpayerRegistrationRegion || '';
            orgPhone = csoDetails.contactPhone || '';
            orgEmail = csoDetails.contactEmail || '';
          }
          break;
      }
    }

    console.log("Organization name extracted:", orgName);

    /* ---------------- FORMAT PURCHASE ITEMS ---------------- */
    const formattedItems = purchase.items.map(item => ({
      purchase_item_id: item.purchase_item_id,
      purchase_id: item.purchase_id,
      purchase_item_type: item.purchase_item_type,
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
      name: item.unitObject?.name || 'Unit'
    }));

    console.log("Number of items:", formattedItems.length);

    // Get GST percentage from first item or default to 5%
    const gstPercentage = formattedItems.length > 0 ? formattedItems[0]?.gst_percentage || 5 : 5;

    /* ---------------- GENERATE HTML ---------------- */
    const html = generatePurchaseInvoiceHTML({
      purchaseId: purchaseId,
      purchase: {
        purchase_id: purchase.purchase_id,
        purchase_order_no: purchase.purchase_order_no,
        purchase_date: purchase.purchase_date,
        sales_amount: purchase.sales_amount,
        exempt_amount: purchase.exempt_amount,
        taxable_amount: purchase.taxable_amount,
        gst_amount: purchase.gst_amount,
        total_invoice_amount: purchase.total_invoice_amount,
        created_on: purchase.created_on,
        currencyName: purchase.currency_info?.currencyName || 'BTN',
        currencySymbol: purchase.currency_info?.currencySymbol || 'Nu.',
        payment_mode: purchase.payment_mode,
        transaction_id: purchase.transaction_id,
        cheque_number: purchase.cheque_number,
        journal_number: purchase.journal_number,
        bank_name: purchase.bank_name
      },
      items: formattedItems,
      supplier: supplierInfo,
      dealer: dealerInfo,
      organization: {
        name: orgName,
        tpn: orgCode,
        address: orgAddress,
        phone: orgPhone,
        email: orgEmail
      },
      gstPercentage: gstPercentage
    });

    console.log("HTML generated successfully");

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="purchase-invoice-${purchase.purchase_order_no || purchaseId}.html"`
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

function generatePurchaseInvoiceHTML(data) {
  const { purchaseId, purchase, items, supplier, dealer, organization, gstPercentage } = data;

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
    if (!invoiceNo) return 'https://gst.drcs.bt/verify/PINV2025001';
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

  const currencySymbol = getCurrencySymbol(purchase.currency);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Purchase Invoice - ${purchase.purchase_order_no || `PO-${purchaseId}`}</title>

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

    .supplier-block, .organization-block, .dealer-block {
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
    
    /* Print and Download Buttons Container */
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
    
    .text-center {
      text-align: center;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-left {
      text-align: left;
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
    line-height: 57px;">Buyer Credited Tax Invoice</h1>
      <center style="margin-top: 10px;"><b>Copy</b></center>
    

    <!-- Invoice No + Date -->
    <div class="top-row">
      <div>
        <span class="label-bold">Purchase Order No.:</span>
        ${purchase.purchase_order_no || `PO-${purchaseId}`}
      </div>

      <div>
        <span class="label-bold">Purchase Date:</span>
        ${formatDate(purchase.purchase_date)}
      </div>
      <div>
        <span class="label-bold">Issue Date:</span>
        ${formatDate(new Date())}
      </div>
    </div>

    <!-- Organization (Purchaser) + QR -->
    <div class="top-row">
      <div class="supplier-block" style="margin-top: 10px;">
      <div style="font-weight: bold; margin-bottom: 5px;">Supplier Information:</div>
      ${supplier?.name ? `<span class="label-bold">Supplier Name:</span> ${supplier.name}<br>` : ''}
      ${supplier?.tpn ? `<span class="label-bold">TPN:</span> ${supplier.tpn}<br>` : ''}
      ${supplier?.licenseNo ? `<span class="label-bold">License No.:</span> ${supplier.licenseNo}<br>` : ''}
      ${supplier?.address ? `<span class="label-bold">Address:</span> ${supplier.address}<br>` : ''}
      ${supplier?.email ? `<span class="label-bold">Email:</span> ${supplier.email}<br>` : ''}
      ${supplier?.phone ? `<span class="label-bold">Phone:</span> ${supplier.phone}<br>` : ''}
    </div>

      <div class="qr-block">
        <div id="qrcode"></div>
        <div class="qr-label"></div>
      </div>
    </div>

    <!-- Supplier -->
    

    <!-- Dealer (if exists) -->
    <div class="whole" style="margin-top:-100px;">
    ${dealer?.name ? `
      <div class="dealer-block" style="padding-top: 10px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Dealer Information:</div>
        ${dealer?.name ? `<span class="label-bold">Dealer Name:</span> ${dealer.name}<br>` : ''}
        ${dealer?.tpn ? `<span class="label-bold">TPN:</span> ${dealer.tpn}<br>` : ''}
        ${dealer?.licenseNo ? `<span class="label-bold">License No.:</span> ${dealer.licenseNo}<br>` : ''}
        ${dealer?.address ? `<span class="label-bold">Address:</span> ${dealer.address}<br>` : ''}
        ${dealer?.email ? `<span class="label-bold">Email:</span> ${dealer.email}<br>` : ''}
        ${dealer?.phone ? `<span class="label-bold">Phone:</span> ${dealer.phone}<br>` : ''}
      </div>
    ` : ''}

    <div class="currency" >Currency: ${purchase.currencyName}</div>
    <div class="payment">
      Payment Mode: ${purchase.payment_mode
      ? purchase.payment_mode === 'CASH'
        ? 'Cash'

        : purchase.payment_mode === 'PAYMENT_GATEWAY'
          ? `Payment Gateway (Txn ID: ${purchase.transaction_id || 'N/A'})`

          : ['MBOB', 'MPAY', 'TPAY', 'DRUKPAY', 'EPAY', 'DK_BANK'].includes(
            purchase.payment_mode
          )
            ? `${purchase.payment_mode} (Journal No: ${purchase.journal_number || 'N/A'})`

            : purchase.payment_mode === 'CHEQUE'
              ? `Cheque (No: ${purchase.cheque_number || 'N/A'}, Bank: ${purchase.bank_name
                ? purchase.bank_name.replace(/_/g, ' ')
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
          <th>Item Type</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit</th>
          <th>Unit Price</th>
          <th>Amount</th>
          <th>Discount</th>
          
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        ${items.map((item, index) => {
      const amount = (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
      const discount = parseFloat(item.discount) || 0;
      const amountAfterDiscount = amount - discount;
      const gstAmount = 0;
      const itemTotal = amountAfterDiscount;

      return `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td class="text-center">${item.purchase_item_type === 'GOODS' ? 'Goods' : 'Service'}</td>
              <td class="text-left">
                ${item.goods_service_name || ''}
                ${item.goods_service_description ? `<br><small>${item.goods_service_description}</small>` : ''}
              </td>
              <td class="text-center">${item.quantity || ''}</td>
              <td class="text-center">${item.name || 'Unit'}</td>
              <td class="text-right">${formatCurrency(item.unit_price)}</td>
              <td class="text-right">${formatCurrency(item.amount)}</td>
              <td class="text-right">${formatCurrency(item.discount)}</td>
              <td class="text-right" style="font-weight: bold;">${formatCurrency(itemTotal)}</td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals">
      <div><span>Total Amount</span> ${formatCurrency(purchase.sales_amount)}</div>
      
    </div>

    <div class="invoice-value">
      Total Purchase Value: ${formatCurrency(purchase.total_invoice_amount)}
    </div>

    <div class="words">
      Amount in Words: ${numberToWords(purchase.total_invoice_amount)} ${purchase.currencyName} Only
    </div>

    <!-- DECLARATION -->
    <div class="declaration">
      <div>Declaration: We certify that this invoice is issued for the purchase of goods/services as detailed above.</div>
      <div>Authorized Signature (Purchaser): _____________________</div>
      <div>Authorized Signature (Supplier): _____________________</div>
      
    </div>
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
    <a href="/purchase" class="close-button">
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
    
    // Print invoice function
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

    // QR Code Data for Purchase Invoice
    const qrText = JSON.stringify({
      purchaseNo: '${purchase.purchase_order_no}',
      purchaseDate: '${formatDateForQR(purchase.purchase_date)}',
      invoiceType: "purchase",
      supplier: "${supplier.name}",
      supplierTpn: '${supplier.tpn}',
      amount: '${purchase.total_invoice_amount}',
      currency: '${purchase.currencyName}'
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
              po: '${purchase.purchase_order_no}',
              date: '${formatDateForQR(purchase.purchase_date)}',
              amt: '${purchase.total_invoice_amount}',
              sup: '${supplier.tpn}'
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
        const fileName = 'purchase-invoice-' + ('${purchase.purchase_order_no || purchaseId}').replace(/[^a-z0-9]/gi, '_') + '.pdf';
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
</html>`;
}