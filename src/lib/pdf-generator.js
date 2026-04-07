import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper functions
export function formatDate(dateString) {
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
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return parseFloat(amount).toFixed(2);
}

export function numberToWords(num) {
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
}

export function parseAddressFromJson(json) {
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


export function generateInvoiceHTML(data) {
  const { salesId, sales, items, party, organization, gstPercentage,emailOriginalInvoiceSent } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${sales.sales_invoice_no || 'INV/2025/001'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      font-size: 14px;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    h1 {
      text-align: center;
      margin-bottom: 0;
      font-size: 24px;
      border-top: 2px solid black;
      border-bottom: 2px solid black;
      line-height: 57px;
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
   .invoice-container {
      width: 794px;
      background: white;
      padding: 70px;
      height: auto;
      min-height: auto;
    }
    @media print {
      body {
        margin: 0;
        background: white;
      }
      .invoice-container {
        box-shadow: none;
        padding: 20px;
      }
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <h1>Tax Invoice</h1>
    <div class="sub-title">${emailOriginalInvoiceSent === 'Y' ? 'Original' : 'Copy'}</div>

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
    <div class="customer-block" style="margin-top:-135px;">
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
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Rate</th>
                        <th>Discount</th>
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
      <div><span>GST@${gstPercentage}%</span> ${formatCurrency(sales.gst_amount)}</div>
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
      <div>Place of Supply: ${organization.address || 'Norzhi Lam, Thimphu, '} Bhutan</div>
    </div>
  </div>

  <!-- QR Code Library -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/lib/qrcode.min.js"></script>
  
  <script>
    // Generate QR code using qrcode-svg library
    const qrText = JSON.stringify({
  invoiceNo: '${sales.sales_invoice_no}',
  invoiceDate: '${formatDateForQR(sales.sales_date)}',
  invoiceType: "${emailOriginalInvoiceSent === 'Y' ? 'original' : 'copy'}",
  issuedBy: "${organization.name}",
  supplierTpn: '${organization.tpn}',
  goodType: "New Goods / Services",
  verificationUrl: "",
  amount: '${sales.total_invoice_amount}'
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
        const compactQrText = JSON.stringify({
          inv: '${sales.sales_invoice_no}',
          date: '${formatDateForQR(sales.sales_date)}',
          amt: '${sales.total_invoice_amount}',
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

    // Helper function to format date for QR code
    function formatDateForQR(dateString) {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    }
  </script>
</body>
</html>
`;
}