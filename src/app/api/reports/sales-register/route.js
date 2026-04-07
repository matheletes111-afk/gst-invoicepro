import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrganizationIdFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const organizationId = await getOrganizationIdFromRequest(request);

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Organization ID not found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const exportType = searchParams.get('export');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      organization_id: organizationId,
      status: {
        not: 'D',
      },
    };

    // Date range filter
    if (fromDate || toDate) {
      where.sales_date = {};
      if (fromDate) {
        where.sales_date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.sales_date.lte = new Date(toDate);
      }
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { sales_invoice_no: { contains: search, } },
        { customer_name: { contains: search, } },
        { customer_tpn: { contains: search, } },
        {
          customer: {
            OR: [
              { businessParty: { businessName: { contains: search, } } },
              { governmentAgencyParty: { agencyName: { contains: search, } } },
              { corporationParty: { corporationName: { contains: search, } } },
              { csoParty: { csoName: { contains: search, } } },
              { individualParty: { name: { contains: search, } } },
            ]
          }
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.sales.count({
      where
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated sales data with customer relation
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
        items: {
          select: {
            goods_service_name: true,
            quantity: true,
            unit_price: true,
            gst_amount: true,
          }
        },
        currency_info: true,
      },
      orderBy: {
        sales_date: 'desc',
      },
      where: {
        status: {
          not: 'D'
        }
      },
      skip,
      take: limit,
    });

    // Fetch all sales for summary (without pagination)
    const allSales = await prisma.sales.findMany({
      where,
      select: {
        taxable_amount: true,
        exempt_amount: true,
        gst_amount: true,
        total_invoice_amount: true,
      },

    });

    // Calculate summary from ALL filtered data
    const summary = {
      total_invoices: totalCount,
      total_taxable: allSales.reduce((sum, sale) => sum + (Number(sale.taxable_amount) || 0), 0),
      total_exempt: allSales.reduce((sum, sale) => sum + (Number(sale.exempt_amount) || 0), 0),
      total_gst: allSales.reduce((sum, sale) => sum + (Number(sale.gst_amount) || 0), 0),
      total_revenue: allSales.reduce((sum, sale) => sum + (Number(sale.total_invoice_amount) || 0), 0),
    };

    // Get customer info function
    const getCustomerInfo = (customer) => {
      if (!customer) return { name: null, tpn: null };

      switch (customer.partyType) {
        case "BUSINESS":
          return {
            name: customer.businessParty?.businessName,
            tpn: customer.businessParty?.taxPayerRegNo,
          };
        case "GOVERNMENT_AGENCY":
          return {
            name: customer.governmentAgencyParty?.agencyName,
            tpn: customer.governmentAgencyParty?.taxPayerRegNo,
          };
        case "CORPORATION":
          return {
            name: customer.corporationParty?.corporationName,
            tpn: customer.corporationParty?.taxPayerRegNo,
          };
        case "CSO":
          return {
            name: customer.csoParty?.agencyName,
            tpn: customer.csoParty?.taxPayerRegNo,
          };
        case "INDIVIDUAL":
          return {
            name: customer.individualParty?.fullName,
            tpn: customer.individualParty?.cid,
          };
        default:
          return { name: null, tpn: null };
      }
    };

    // Format data for response
    const formattedData = sales.map(sale => {
      const customerInfo = getCustomerInfo(sale.customer);
      return {
        sales_id: sale.sales_id,
        sales_invoice_no: sale.sales_invoice_no,
        sales_date: sale.sales_date,
        customer_name: sale.customer_name || customerInfo.name,
        customer_tpn: sale.customer_tpn || customerInfo.tpn,
        taxable_amount: sale.taxable_amount,
        exempt_amount: sale.exempt_amount,
        gst_amount: sale.gst_amount,
        total_invoice_amount: sale.total_invoice_amount,
        status: sale.status,
        payment_mode: sale.payment_mode,
        currency: sale.currency_info?.currencyName,
        item_count: sale.items.length,
        customer: customerInfo, // Include full customer info
      };
    });

    // Handle export requests (no pagination for exports)
    if (exportType === 'csv' || exportType === 'pdf') {
      // For exports, fetch all data (not paginated)
      const exportSales = await prisma.sales.findMany({
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
          items: {
            select: {
              goods_service_name: true,
              quantity: true,
              unit_price: true,
              gst_amount: true,
            }
          },
          currency_info: true,
        },
        orderBy: {
          sales_date: 'desc',
        },
      });

      const exportFormattedData = exportSales.map(sale => {
        const customerInfo = getCustomerInfo(sale.customer);
        return {
          sales_id: sale.sales_id,
          sales_invoice_no: sale.sales_invoice_no,
          sales_date: sale.sales_date,
          customer_name: sale.customer_name || customerInfo.name,
          customer_tpn: sale.customer_tpn || customerInfo.tpn,
          taxable_amount: sale.taxable_amount,
          exempt_amount: sale.exempt_amount,
          gst_amount: sale.gst_amount,
          total_invoice_amount: sale.total_invoice_amount,
          status: sale.status,
          payment_mode: sale.payment_mode,
          currency: sale.currency_info?.currencyName,
          item_count: sale.items.length,
          customer: customerInfo,
        };
      });

      if (exportType === 'csv') {
        // Convert to CSV
        const headers = [
          'Invoice No',
          'Date',
          'Customer Name',
          'Customer TPN',
          'Taxable Value',
          'Exempt Value',
          'GST Amount',
          'Total Invoice Amount',
          'Status',
          'Payment Mode',
          'Currency',
          'Item Count'
        ];

        const csvRows = [
          headers.join(','),
          ...exportFormattedData.map(row => [
            `"${row.sales_invoice_no || ''}"`,
            `"${new Date(row.sales_date).toISOString().split('T')[0]}"`,
            `"${row.customer_name || ''}"`,
            `"${row.customer_tpn || ''}"`,
            row.taxable_amount,
            row.exempt_amount,
            row.gst_amount,
            row.total_invoice_amount,
            `"${row.status === 'C' ? 'Completed' : row.status === 'IP' ? 'In Progress' : 'Cancelled'}"`,
            `"${row.payment_mode || ''}"`,
            `"${row.currency || ''}"`,
            row.item_count
          ].join(','))
        ];

        const csvContent = csvRows.join('\n');

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="sales-transactions-report-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }

      if (exportType === 'pdf') {
        try {
          const { jsPDF } = await import('jspdf');

          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });

          // Title
          doc.setFontSize(16);
          doc.text('Sales Register Report', 14, 15);

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
          if (status && status !== 'ALL') {
            doc.text(`Status: ${status}`, 14, yPos);
            yPos += 5;
          }
          if (search) {
            doc.text(`Search: ${search}`, 14, yPos);
            yPos += 5;
          }

          // Table data
          yPos += 3;
          const headers = ['Invoice No', 'Date', 'Customer', 'TPN', 'Taxable', 'Exempt', 'GST', 'Total', 'Status'];

          // Column widths (in mm)
          const colWidths = [20, 16, 25, 18, 18, 18, 18, 18, 15];
          const rowHeight = 6;
          const pageWidth = 297; // A4 landscape width
          const leftMargin = 10;

          let currentPage = 1;

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

          exportFormattedData.forEach((row, idx) => {
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
              (row.sales_invoice_no || '').substring(0, 15),
              new Date(row.sales_date).toLocaleDateString(),
              (row.customer_name || '').substring(0, 20),
              (row.customer_tpn || '').substring(0, 15),
              parseFloat(row.taxable_amount || 0).toFixed(2),
              parseFloat(row.exempt_amount || 0).toFixed(2),
              parseFloat(row.gst_amount || 0).toFixed(2),
              parseFloat(row.total_invoice_amount || 0).toFixed(2),
              row.status === 'C' ? 'Completed' : row.status === 'IP' ? 'Submitted' : 'Cancelled'
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

          // Add summary section
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
          doc.text(`Total Invoices: ${summary.total_invoices}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Taxable: ${parseFloat(summary.total_taxable).toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Exempt: ${parseFloat(summary.total_exempt).toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total GST: ${parseFloat(summary.total_gst).toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Revenue: ${parseFloat(summary.total_revenue).toFixed(2)}`, 14, yPos);

          // Get PDF as blob
          const pdfBlob = doc.output('blob');

          return new Response(pdfBlob, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="sales-register-report-${new Date().toISOString().split('T')[0]}.pdf"`
            }
          });
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to generate PDF',
              details: pdfError.message
            },
            { status: 500 }
          );
        }
      }
    }

    // Return JSON response for normal requests with pagination info
    return NextResponse.json({
      success: true,
      data: formattedData,
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
        search,
        status
      }
    });

  } catch (error) {
    console.error('Error in sales transactions report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}