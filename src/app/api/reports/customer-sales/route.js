import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - Customer-wise sales report
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

    // Search filter
    if (search) {
      where.OR = [
        { customer_name: { contains: search } },
        { customer_tpn: { contains: search } },
        { sales_invoice_no: { contains: search } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.sales.count({
      where,
    });

    // Get paginated sales for the organization
    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true,
          }
        },
        items: true,
      },
      skip,
      take: limit,
      orderBy: { sales_date: 'desc' }
    });

    // Group by customer
    const customerMap = new Map();

    sales.forEach(sale => {
      const customerId = sale.customer_id;
      
      if (!customerMap.has(customerId)) {
        // Get customer info
        const customerInfo = getCustomerInfo(sale.customer);
        
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: sale.customer_name || customerInfo.name || "Unknown",
          tpn: sale.customer_tpn || customerInfo.tpn || "-",
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          invoice_count: 0,
          total_taxable_value: 0,
          total_gst_value: 0,
          total_invoice_value: 0,
          payment_status: "PAID", // Default payment status
          invoices: []
        });
      }

      const customerData = customerMap.get(customerId);
      
      customerData.invoice_count += 1;
      customerData.total_taxable_value += Number(sale.taxable_amount);
      customerData.total_gst_value += Number(sale.gst_amount);
      customerData.total_invoice_value += Number(sale.total_invoice_amount);
      
      // Update payment status only if there's an unpaid invoice
      if (sale.status === "UP") {
        customerData.payment_status = "PAID";
      }
      // If partially paid, mark as partial
      else if (sale.status === "IP" && customerData.payment_status !== "UNPAID") {
        customerData.payment_status = "PAID";
      }
      
      customerData.invoices.push({
        invoice_no: sale.sales_invoice_no,
        date: sale.sales_date,
        amount: sale.total_invoice_amount,
        status: sale.status
      });
    });

    // Convert to array
    let reportData = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      total_taxable_value: Number(customer.total_taxable_value.toFixed(2)),
      total_gst_value: Number(customer.total_gst_value.toFixed(2)),
      total_invoice_value: Number(customer.total_invoice_value.toFixed(2)),
    }));

    // Sort by total invoice value (descending)
    reportData.sort((a, b) => b.total_invoice_value - a.total_invoice_value);

    // Calculate summary
    const summary = {
      total_customers: totalCount,
      total_invoices: sales.length,
      grand_total_taxable: Number(sales.reduce((sum, sale) => sum + Number(sale.taxable_amount), 0).toFixed(2)),
      grand_total_gst: Number(sales.reduce((sum, sale) => sum + Number(sale.gst_amount), 0).toFixed(2)),
      grand_total_invoice: Number(sales.reduce((sum, sale) => sum + Number(sale.total_invoice_amount), 0).toFixed(2))
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Handle export requests
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
    console.error("Error generating customer sales report:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to get customer info
function getCustomerInfo(customer) {
  if (!customer) return {};

  switch (customer.partyType) {
    case "BUSINESS":
      return {
        name: customer.businessParty?.businessName,
        tpn: customer.businessParty?.taxPayerRegNo,
        email: customer.businessParty?.officeEmail,
        phone: customer.businessParty?.officePhone,
        address: customer.businessParty?.address,
      };

    case "GOVERNMENT_AGENCY":
      return {
        name: customer.governmentAgencyParty?.agencyName,
        tpn: customer.governmentAgencyParty?.taxPayerRegNo,
        email: customer.governmentAgencyParty?.officeEmail,
        phone: customer.governmentAgencyParty?.officePhone,
        address: customer.governmentAgencyParty?.address,
      };

    case "CORPORATION":
      return {
        name: customer.corporationParty?.corporationName,
        tpn: customer.corporationParty?.taxPayerRegNo,
        email: customer.corporationParty?.officeEmail,
        phone: customer.corporationParty?.officePhone,
        address: customer.corporationParty?.address,
      };

    case "CSO":
      return {
        name: customer.csoParty?.agencyName,
        tpn: customer.csoParty?.taxPayerRegNo,
        email: customer.csoParty?.officeEmail,
        phone: customer.csoParty?.officePhone,
        address: customer.csoParty?.address,
      };

    case "INDIVIDUAL":
      return {
        name: customer.individualParty?.fullName,
        tpn: customer.individualParty?.cid,
        email: customer.individualParty?.email,
        phone: customer.individualParty?.phone,
        address: customer.individualParty?.address,
      };

    default:
      return {};
  }
}

// Helper function to generate CSV report
function generateCSVReport(data, summary, fromDate, toDate, search) {
  // Create CSV headers
  const headers = [
    'S.No',
    'Customer Name',
    'TPN',
    'Email',
    'Phone',
    'Invoice Count',
    'Total Taxable Value',
    'Total GST Value',
    'Total Invoice Value',
    'Payment Status'
  ];

  // Create CSV rows
  const rows = data.map((customer, index) => [
    index + 1,
    `"${(customer.customer_name || '').replace(/"/g, '""')}"`,
    customer.tpn || '-',
    customer.email || '-',
    customer.phone || '-',
    customer.invoice_count,
    customer.total_taxable_value,
    customer.total_gst_value,
    customer.total_invoice_value,
    customer.payment_status
  ]);

  // Create report info
  const reportInfo = [
    'Customer Wise Sales Report',
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
  reportInfo.push(`Total Customers: ${data.length}`);
  reportInfo.push(`Total Invoices: ${summary.total_invoices}`);
  reportInfo.push(`Total Taxable Value: ${summary.grand_total_taxable}`);
  reportInfo.push(`Total GST Value: ${summary.grand_total_gst}`);
  reportInfo.push(`Total Invoice Value: ${summary.grand_total_invoice}`);
  reportInfo.push('');

  // Combine all content
  const csvContent = [
    ...reportInfo,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `customer-sales-report-${new Date().toISOString().split('T')[0]}.csv`;
  
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
    doc.text('Customer Wise Sales Report', 14, 15);

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
    const headers = ['Customer', 'TPN', 'Invoices', 'Taxable Value', 'GST Value', 'Total Value', 'Status'];

    // Column widths (in mm) - 7 columns
    const colWidths = [35, 25, 18, 28, 25, 28, 20];
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

    data.forEach((customer, idx) => {
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
        customer.customer_name || '-',
        customer.tpn || '-',
        customer.invoice_count.toString(),
        customer.total_taxable_value.toFixed(2),
        customer.total_gst_value.toFixed(2),
        customer.total_invoice_value.toFixed(2),
        customer.payment_status || 'PAID'
      ];

      doc.setTextColor(0, 0, 0);
      rowData.forEach((cell, i) => {
        const cellText = String(cell);
        const cellAlign = i > 1 ? 'right' : 'left';
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
    doc.text(`Total Customers: ${data.length}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Invoices: ${summary.total_invoices}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Taxable Value: ${summary.grand_total_taxable.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total GST Value: ${summary.grand_total_gst.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Invoice Value: ${summary.grand_total_invoice.toFixed(2)}`, 14, yPos);

    // Get PDF as blob
    const pdfBlob = doc.output('blob');

    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="customer-sales-report-${new Date().toISOString().split('T')[0]}.pdf"`
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