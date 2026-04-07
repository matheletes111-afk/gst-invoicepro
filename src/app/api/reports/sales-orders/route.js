import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - Sales Order Report
export async function GET(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Filters
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const search = searchParams.get("search") || "";
    const exportType = searchParams.get("export");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Build where clause
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId
    };

    // Date range filter
    if (fromDate || toDate) {
      where.sales_date = {};

      if (fromDate) {
        where.sales_date.gte = new Date(fromDate + "T00:00:00");
      }

      if (toDate) {
        where.sales_date.lte = new Date(toDate + "T23:59:59");
      }
    }

    // Search filter for invoice number or customer name
    if (search) {
      where.OR = [
        { sales_invoice_no: { contains: search } },
        { customer_name: { contains: search } },
        { customer_tpn: { contains: search } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.sales.count({
      where,
    });

    // Get paginated sales orders
    const salesOrders = await prisma.sales.findMany({
      where,
      include: {
        customer: true,
        currency_info: true,
      },
      skip,
      take: limit,
      orderBy: { sales_date: 'desc' }
    });

    // Format the data
    const reportData = salesOrders.map(order => ({
      sales_id: order.sales_id,
      sales_invoice_no: order.sales_invoice_no || "-",
      sales_date: order.sales_date,
      customer_name: order.customer_name || order.customer?.name || "Unknown",
      customer_tpn: order.customer_tpn || order.customer?.tpn || "-",
      sales_amount: Number(order.sales_amount.toFixed(2)),
      exempt_amount: Number(order.exempt_amount.toFixed(2)),
      taxable_amount: Number(order.taxable_amount.toFixed(2)),
      gst_amount: Number(order.gst_amount.toFixed(2)),
      total_invoice_amount: Number(order.total_invoice_amount.toFixed(2)),
      status: order.status,
      payment_mode: order.payment_mode
    }));

    // Calculate summary from ALL data (not just paginated)
    const allSalesOrders = await prisma.sales.findMany({
      where,
      select: {
        sales_amount: true,
        exempt_amount: true,
        taxable_amount: true,
        gst_amount: true,
        total_invoice_amount: true
      }
    });

    const summary = {
      total_orders: totalCount,
      total_sales_amount: Number(allSalesOrders.reduce((sum, order) => sum + Number(order.sales_amount), 0).toFixed(2)),
      total_exempt_amount: Number(allSalesOrders.reduce((sum, order) => sum + Number(order.exempt_amount), 0).toFixed(2)),
      total_taxable_amount: Number(allSalesOrders.reduce((sum, order) => sum + Number(order.taxable_amount), 0).toFixed(2)),
      total_gst_amount: Number(allSalesOrders.reduce((sum, order) => sum + Number(order.gst_amount), 0).toFixed(2)),
      total_invoice_amount: Number(allSalesOrders.reduce((sum, order) => sum + Number(order.total_invoice_amount), 0).toFixed(2))
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Handle export requests (no pagination for exports)
    if (exportType === 'csv') {
      return generateCSVReport(reportData, summary, fromDate, toDate, search);
    }

    if (exportType === 'pdf') {
      return generatePDFReport(reportData, summary, fromDate, toDate, search);
    }

    return Response.json({
      success: true,
      data: reportData,
      summary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        fromDate,
        toDate,
        search
      }
    });

  } catch (error) {
    console.error("Error generating sales order report:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to generate CSV report
function generateCSVReport(data, summary, fromDate, toDate, search) {
  // Create CSV headers
  const headers = [
    'S.No',
    'Sales Order No',
    'Date',
    'Customer',
    'TPN',
    'Sales Amount',
    'Exempt Amount',
    'Taxable Amount',
    'GST Amount',
    'Total Invoice Amount',
    'Payment Mode'
  ];

  // Create CSV rows
  const rows = data.map((order, index) => [
    index + 1,
    `"${(order.sales_invoice_no || '').replace(/"/g, '""')}"`,
    new Date(order.sales_date).toLocaleDateString(),
    `"${(order.customer_name || '').replace(/"/g, '""')}"`,
    order.customer_tpn || '-',
    order.sales_amount,
    order.exempt_amount,
    order.taxable_amount,
    order.gst_amount,
    order.total_invoice_amount,
    order.payment_mode || '-'
  ]);

  // Create report info
  const reportInfo = [
    'Sales Order Report',
    '',
  ];

  // Add filter info if any filters are applied
  if (fromDate || toDate || search) {
    const filterInfo = [];
    if (fromDate) filterInfo.push(`From: ${fromDate}`);
    if (toDate) filterInfo.push(`To: ${toDate}`);
    if (search) filterInfo.push(`Search: "${search}"`);
    
    if (filterInfo.length > 0) {
      reportInfo.push(`Filters Applied: ${filterInfo.join(' | ')}`);
      reportInfo.push('');
    }
  }

  reportInfo.push(`Generated on: ${new Date().toLocaleDateString()}`);
  reportInfo.push('');
  
  // Add summary
  reportInfo.push('SUMMARY');
  reportInfo.push(`Total Orders: ${summary.total_orders}`);
  reportInfo.push(`Total Sales Amount: ${summary.total_sales_amount}`);
  reportInfo.push(`Total Exempt Amount: ${summary.total_exempt_amount}`);
  reportInfo.push(`Total Taxable Amount: ${summary.total_taxable_amount}`);
  reportInfo.push(`Total GST Amount: ${summary.total_gst_amount}`);
  reportInfo.push(`Total Invoice Amount: ${summary.total_invoice_amount}`);
  reportInfo.push('');

  // Combine all content
  const csvContent = [
    ...reportInfo,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `sales-order-report-${new Date().toISOString().split('T')[0]}.csv`;
  
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}

// Helper function to generate PDF report
async function generatePDFReport(data, summary, fromDate, toDate, search) {
  try {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFontSize(16);
    doc.text('Sales Order Report', 14, 15);

    // Filter info
    doc.setFontSize(9);
    let yPos = 22;
    if (fromDate) {
      doc.text(`From Date: ${new Date(fromDate).toLocaleDateString()}`, 14, yPos);
      yPos += 5;
    }
    if (toDate) {
      doc.text(`To Date: ${new Date(toDate).toLocaleDateString()}`, 14, yPos);
      yPos += 5;
    }
    if (search) {
      doc.text(`Search: ${search}`, 14, yPos);
      yPos += 5;
    }

    // Table data
    yPos += 3;
    const headers = ['Invoice No', 'Date', 'Customer', 'TPN', 'Sales', 'Exempt', 'Taxable', 'GST', 'Total'];

    // Column widths (in mm) - 9 columns
    const colWidths = [20, 15, 28, 15, 18, 18, 18, 18, 22];
    const rowHeight = 8;
    const pageWidth = 297; // A4 landscape width
    const leftMargin = 10;

    // Function to draw table header
    const drawHeader = (yPosition) => {
      let xPos = leftMargin;
      headers.forEach((header, i) => {
        // Set blue fill color for each cell
        doc.setFillColor(0, 102, 204);
        doc.rect(xPos, yPosition, colWidths[i], rowHeight, 'F');

        // Draw cell borders
        doc.setDrawColor(0, 102, 204);
        doc.rect(xPos, yPosition, colWidths[i], rowHeight);

        // Set white text color for each cell
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text(header, xPos + 1, yPosition + 3.5, {
          maxWidth: colWidths[i] - 2,
          align: 'left'
        });
        xPos += colWidths[i];
      });

      return yPosition + rowHeight;
    };

    // Draw initial header
    yPos = drawHeader(yPos);

    // Draw rows
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);

    data.forEach((order, idx) => {
      // Check if we need a new page
      if (yPos + rowHeight > 270) {
        doc.addPage();
        yPos = 10;
        yPos = drawHeader(yPos);
      }

      // Alternate row color
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        let xPos = leftMargin;
        colWidths.forEach(width => {
          doc.rect(xPos, yPos, width, rowHeight, 'F');
          xPos += width;
        });
      }

      // Draw cell borders
      let xPos = leftMargin;
      colWidths.forEach(width => {
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, yPos, width, rowHeight);
        xPos += width;
      });

      // Draw row data
      xPos = leftMargin;
      const rowData = [
        order.sales_invoice_no || '-',
        new Date(order.sales_date).toLocaleDateString(),
        order.customer_name || '-',
        order.customer_tpn || '-',
        order.sales_amount.toFixed(2),
        order.exempt_amount.toFixed(2),
        order.taxable_amount.toFixed(2),
        order.gst_amount.toFixed(2),
        order.total_invoice_amount.toFixed(2)
      ];

      doc.setTextColor(0, 0, 0);
      rowData.forEach((cell, i) => {
        const cellText = String(cell);
        const cellAlign = i > 3 ? 'right' : 'left';
        const textX = cellAlign === 'right' ? xPos + colWidths[i] - 1 : xPos + 1;

        doc.text(cellText, textX, yPos + 3.5, {
          maxWidth: colWidths[i] - 2,
          align: cellAlign
        });
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });

    // Add summary section after table
    yPos += 8;
    if (yPos > 260) {
      doc.addPage();
      yPos = 10;
    }

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 14, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Orders: ${summary.total_orders}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Sales Amount: ${summary.total_sales_amount.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Exempt Amount: ${summary.total_exempt_amount.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Taxable Amount: ${summary.total_taxable_amount.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total GST Amount: ${summary.total_gst_amount.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Invoice Amount: ${summary.total_invoice_amount.toFixed(2)}`, 14, yPos);

    // Get PDF as blob
    const pdfBlob = doc.output('blob');

    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sales-order-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });
  } catch (pdfError) {
    console.error('Error generating PDF:', pdfError);
    return Response.json(
      {
        success: false,
        error: 'Failed to generate PDF',
        details: pdfError.message
      },
      { status: 500 }
    );
  }
}