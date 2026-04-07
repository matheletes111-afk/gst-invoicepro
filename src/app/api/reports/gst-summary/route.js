import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - GST Summary Report
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

    // Required filters
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const exportExcel = searchParams.get("export") === "excel";

    // Check if date range is provided
    if (!fromDate || !toDate) {
      return Response.json({
        success: true,
        data: [],
        summary: null,
        message: "Please select a date range to view GST summary"
      });
    }

    // Build where clause
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId,
      sales_date: {
        gte: new Date(fromDate + "T00:00:00"),
        lte: new Date(toDate + "T23:59:59")
      }
    };

    // Get sales for the period
    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: true,
        currency_info: true,
      },
      orderBy: { sales_date: 'asc' }
    });

    // Calculate summary
    const summary = {
      total_sales: sales.length,
      total_taxable_value: Number(sales.reduce((sum, sale) => sum + Number(sale.taxable_amount), 0).toFixed(2)),
      total_exempt_amount: Number(sales.reduce((sum, sale) => sum + Number(sale.exempt_amount), 0).toFixed(2)),
      total_gst_amount: Number(sales.reduce((sum, sale) => sum + Number(sale.gst_amount), 0).toFixed(2)),
      total_invoice_amount: Number(sales.reduce((sum, sale) => sum + Number(sale.total_invoice_amount), 0).toFixed(2))
    };

    // Format sales data for display
    const salesData = sales.map(sale => ({
      sales_id: sale.sales_id,
      sales_invoice_no: sale.sales_invoice_no || "-",
      sales_date: sale.sales_date,
      customer_name: sale.customer_name || sale.customer?.name || "Unknown",
      customer_tpn: sale.customer_tpn || sale.customer?.tpn || "-",
      taxable_amount: Number(sale.taxable_amount.toFixed(2)),
      exempt_amount: Number(sale.exempt_amount.toFixed(2)),
      gst_amount: Number(sale.gst_amount.toFixed(2)),
      total_invoice_amount: Number(sale.total_invoice_amount.toFixed(2)),
      status: sale.status
    }));

    // Export to CSV if requested
    if (exportExcel) {
      return generateCSVReport(salesData, summary, fromDate, toDate);
    }

    return Response.json({
      success: true,
      data: salesData,
      summary,
      period: {
        from_date: fromDate,
        to_date: toDate
      }
    });

  } catch (error) {
    console.error("Error generating GST summary report:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to generate CSV report
function generateCSVReport(data, summary, fromDate, toDate) {
  // Create CSV headers
  const headers = [
    'S.No',
    'Invoice No',
    'Date',
    'Customer',
    'TPN',
    'Taxable Amount',
    'Exempt Amount',
    'GST Amount',
    'Total Invoice Amount',
    
  ];

  // Create CSV rows
  const rows = data.map((sale, index) => [
    index + 1,
    `"${(sale.sales_invoice_no || '').replace(/"/g, '""')}"`,
    new Date(sale.sales_date).toLocaleDateString(),
    `"${(sale.customer_name || '').replace(/"/g, '""')}"`,
    sale.customer_tpn || '-',
    sale.taxable_amount,
    sale.exempt_amount,
    sale.gst_amount,
    sale.total_invoice_amount,
    
  ]);

  // Create report info
  const reportInfo = [
    'GST Summary Report',
    '',
    `Period: ${fromDate} to ${toDate}`,
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
  ];

  // Add summary
  reportInfo.push('SUMMARY');
  reportInfo.push(`Period: ${fromDate} to ${toDate}`);
  reportInfo.push(`Total Sales: ${summary.total_sales}`);
  reportInfo.push(`Total Taxable Value: ${summary.total_taxable_value}`);
  reportInfo.push(`Total Exempt Amount: ${summary.total_exempt_amount}`);
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
  const fileName = `gst-summary-report-${fromDate}-to-${toDate}.csv`;
  
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}