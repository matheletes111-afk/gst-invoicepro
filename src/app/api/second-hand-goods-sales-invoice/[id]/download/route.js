import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const invoice = await prisma.secondHandGoodsSalesInvoice.findUnique({
      where: { invoiceId: Number(params.id) },
      include: {
        organization: {
          include: {
            businessDetails: true,
            governmentAgencyDetail: true,
            corporationDetail: true,
            csoDetail: true
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
          },
          orderBy: { slNo: 'asc' }
        }
      }
    });

    if (!invoice || invoice.status === "D") {
      return new Response("Invoice not found", { status: 404 });
    }

    // Get organization details
    const org = invoice.organization;
    const orgDetails = org?.businessDetails || org?.governmentAgencyDetail || org?.corporationDetail || org?.csoDetail;
    const orgName = orgDetails?.businessName || orgDetails?.agencyName || orgDetails?.corporationName || 'N/A';
    const orgTPN = orgDetails?.taxpayerNumber || orgDetails?.tpn || 'N/A';
    const orgAddress = orgDetails?.businessLocationJson?.address || 'N/A';
    const orgEmail = orgDetails?.contactEmail || 'N/A';
    const orgPhone = orgDetails?.contactPhone || 'N/A';

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .invoice-subtitle {
      font-size: 16px;
      color: #666;
    }
    .invoice-info {
      text-align: right;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .summary {
      width: 400px;
      margin-left: auto;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .total-row {
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 10px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
    }
    .qr-placeholder {
      width: 100px;
      height: 100px;
      border: 2px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
      font-size: 10px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">Tax Invoice</div>
      ${invoice.isOriginal ? '<div class="invoice-subtitle">Original</div>' : ''}
    </div>
    <div class="invoice-info">
      <div><strong>Invoice No.:</strong> ${invoice.invoiceNo}</div>
      <div><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
      <div class="qr-placeholder">QR Code</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Supplier Details</div>
    <div><strong>Supplier Name:</strong> ${orgName}</div>
    <div><strong>TPN:</strong> ${orgTPN}</div>
    <div><strong>Address:</strong> ${orgAddress}</div>
    <div><strong>Email:</strong> ${orgEmail}</div>
    <div><strong>Phone:</strong> ${orgPhone}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div><strong>Customer Name:</strong> ${invoice.customerName || 'N/A'}</div>
    <div><strong>TPN:</strong> ${invoice.customerTPN || 'N/A'}</div>
    <div><strong>Address:</strong> ${invoice.customerAddress || 'N/A'}</div>
    <div><strong>Email:</strong> ${invoice.customerEmail || 'N/A'}</div>
    <div><strong>Phone:</strong> ${invoice.customerPhone || 'N/A'}</div>
  </div>

  <div class="section">
    <div><strong>Currency:</strong> ${invoice.currency?.currencySymbol || 'Nu.'} (${invoice.currency?.currencyName || 'Ngultrum'})</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Sl. No.</th>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Discount</th>
        <th class="text-right">Sale Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map(item => `
        <tr>
          <td>${item.slNo}</td>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity?.toFixed(2) || '0.00'}</td>
          <td class="text-right">${item.unit?.name || '-'}</td>
          <td class="text-right">${item.rate?.toFixed(2) || '0.00'}</td>
          <td class="text-right">${item.discount?.toFixed(2) || '0.00'}</td>
          <td class="text-right">${item.saleAmount?.toFixed(2) || '0.00'}</td>
        </tr>
      `).join('') || ''}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <div><strong>Total Amount:</strong></div>
      <div>${invoice.currency?.currencySymbol || 'Nu.'}${invoice.totalAmount?.toFixed(2) || '0.00'}</div>
    </div>
    <div class="summary-row">
      <div><strong>Exempt Amount:</strong></div>
      <div>${invoice.currency?.currencySymbol || 'Nu.'}${invoice.exemptAmount?.toFixed(2) || '0.00'}</div>
    </div>
    <div class="summary-row">
      <div><strong>Taxable Amount:</strong></div>
      <div>${invoice.currency?.currencySymbol || 'Nu.'}${invoice.taxableAmount?.toFixed(2) || '0.00'}</div>
    </div>
    <div class="summary-row">
      <div><strong>GST @${invoice.gstRate || 0}%:</strong></div>
      <div>${invoice.currency?.currencySymbol || 'Nu.'}${invoice.gstAmount?.toFixed(2) || '0.00'}</div>
    </div>
    <div class="summary-row total-row">
      <div><strong>Total Invoice Value (in ${invoice.currency?.currencySymbol || 'Nu.'}):</strong></div>
      <div><strong>${invoice.currency?.currencySymbol || 'Nu.'}${invoice.totalInvoiceValue?.toFixed(2) || '0.00'}</strong></div>
    </div>
    <div style="margin-top: 10px;">
      <div><strong>Amount in Words:</strong> ${invoice.amountInWords || 'N/A'}</div>
    </div>
  </div>

  <div class="footer">
    <div><strong>Declaration:</strong> ${invoice.declaration || 'We certify that the particulars are true.'}</div>
    ${invoice.authorizedSignature ? `<div style="margin-top: 20px;"><strong>Authorized Signature:</strong><br><img src="${invoice.authorizedSignature}" style="max-width: 200px; max-height: 100px;" /></div>` : ''}
    ${invoice.placeOfSupply ? `<div style="margin-top: 10px;"><strong>Place of Supply:</strong> ${invoice.placeOfSupply}</div>` : ''}
    <div style="margin-top: 20px; font-style: italic;">
      The Goods Sold on this Invoice are sold under the GST Second Hand Goods Scheme
    </div>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNo}.html"`
      }
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

