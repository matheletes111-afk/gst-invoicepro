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
    const itemType = searchParams.get('item_type');
    const exportType = searchParams.get('export');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    // Build where clause for sales
    const salesWhere = {
      organization_id: organizationId,
      status: {
        not: 'D',
      },
    };

    // Date range filter
    if (fromDate || toDate) {
      salesWhere.sales_date = {};
      if (fromDate) {
        salesWhere.sales_date.gte = new Date(fromDate);
      }
      if (toDate) {
        salesWhere.sales_date.lte = new Date(toDate);
      }
    }

    // Fetch all sales items for aggregation (without pagination for aggregation)
    const allSalesItems = await prisma.salesItem.findMany({
      where: {
        sales: salesWhere,
        ...(itemType && itemType !== 'ALL' && { sales_item_type: itemType })
      },
      include: {
        sales: {
          include: {
            customer: {
              include: {
                businessParty: true,
                governmentAgencyParty: true,
                corporationParty: true,
                csoParty: true,
                individualParty: true,
              }
            }
          }
        },
        goods: true,
        service: true,
        unitObject: true,
      },
      orderBy: {
        created_on: 'desc'
      }
    });

    // Aggregate data by item
    const itemMap = new Map();

    allSalesItems.forEach(item => {
      const key = item.sales_item_type === 'GOODS'
        ? `G-${item.goods_id || item.goods_service_name}`
        : `S-${item.service_id || item.goods_service_name}`;

      if (!itemMap.has(key)) {
        // Get customer segment from customer data
        const customerSegment = getCustomerSegment(item.sales.customer);

        itemMap.set(key, {
          item_code: item.sales_item_type === 'GOODS'
            ? item.goods?.goodsCode || '-'
            : item.service?.serviceCode || '-',
          description: item.goods_service_name || 'N/A',
          item_type: item.sales_item_type,
          unit: item.unitObject?.name || '-',
          quantity_sold: 0,
          unit_price: 0,
          total_sales: 0,
          tax_value: 0,
          tax_percentage: item.gst_percentage,
          customer_segment: customerSegment,
          customers: new Set(),
          unit_price_sum: 0,
          count: 0
        });
      }

      const existing = itemMap.get(key);
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const amount = parseFloat(item.amount) || 0;
      const gstAmount = parseFloat(item.gst_amount) || 0;
      const customerId = item.sales.customer_id;

      // Update aggregates
      existing.quantity_sold += quantity;
      existing.total_sales += amount;
      existing.tax_value += gstAmount;
      existing.unit_price_sum += unitPrice;
      existing.count += 1;
      existing.customers.add(customerId);

      // Update average unit price
      existing.unit_price = existing.unit_price_sum / existing.count;
    });

    // Convert map to array
    let itemsData = Array.from(itemMap.values()).map(item => ({
      ...item,
      customer_count: item.customers.size,
      customers: undefined // Remove Set from output
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      itemsData = itemsData.filter(item =>
        item.item_code?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.customer_segment?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const totalCount = itemsData.length;

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Apply pagination (skip and limit)
    const paginatedData = itemsData.slice(skip, skip + limit);

    // Calculate summary statistics from ALL filtered data
    const summary = {
      total_items: totalCount,
      total_quantity: itemsData.reduce((sum, item) => sum + item.quantity_sold, 0),
      total_sales: itemsData.reduce((sum, item) => sum + item.total_sales, 0),
      total_tax: itemsData.reduce((sum, item) => sum + item.tax_value, 0),
      avg_price: itemsData.length > 0
        ? itemsData.reduce((sum, item) => sum + item.unit_price, 0) / itemsData.length
        : 0
    };

    // Helper function to get customer segment
    function getCustomerSegment(customer) {
      if (!customer) return 'Unknown';

      switch (customer.partyType) {
        case 'BUSINESS':
          return 'Business';
        case 'GOVERNMENT_AGENCY':
          return 'Government';
        case 'CORPORATION':
          return 'Corporation';
        case 'CSO':
          return 'CSO/NGO';
        case 'INDIVIDUAL':
          return 'Individual';
        default:
          return 'Other';
      }
    }

    // Handle export requests (no pagination for exports)
    if (exportType === 'csv' || exportType === 'pdf') {
      // For exports, use all data (not paginated)
      const exportData = itemsData;

      if (exportType === 'csv') {
        const headers = [
          'Item Code',
          'Item Name',
          'Type',
          'Unit',
          'Quantity Sold',
          'Unit Price',
          'Total Sales',
          'Tax Value',
          'Tax %',
          'Customer Segment',
          'Customer Count'
        ];

        const csvRows = [
          headers.join(','),
          ...exportData.map(item => [
            `"${item.item_code || ''}"`,
            `"${item.description || ''}"`,
            `"${item.item_type}"`,
            `"${item.unit || ''}"`,
            item.quantity_sold,
            item.unit_price.toFixed(2),
            item.total_sales.toFixed(2),
            item.tax_value.toFixed(2),
            item.tax_percentage || '0',
            `"${item.customer_segment || ''}"`,
            item.customer_count
          ].join(','))
        ];

        const csvContent = csvRows.join('\n');

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="item-wise-sales-summary-${new Date().toISOString().split('T')[0]}.csv"`
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
          doc.text('Item-Wise Sales Summary Report', 14, 15);

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
          if (itemType && itemType !== 'ALL') {
            doc.text(`Item Type: ${itemType}`, 14, yPos);
            yPos += 5;
          }
          if (search) {
            doc.text(`Search: ${search}`, 14, yPos);
            yPos += 5;
          }

          // Table data
          yPos += 3;
          const headers = ['Item Code', 'Item Name', 'Type', 'Qty', 'Unit Price', 'Total Sales', 'Tax', 'Segment'];

          // Column widths (in mm) - 8 columns
          const colWidths = [18, 28, 14, 14, 18, 22, 18, 26];
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

          exportData.forEach((item, idx) => {
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
              item.item_code || '-',
              item.description || 'N/A',
              item.item_type === 'GOODS' ? 'Goods' : 'Service',
              item.quantity_sold.toFixed(2),
              item.unit_price.toFixed(2),
              item.total_sales.toFixed(2),
              item.tax_value.toFixed(2),
              item.customer_segment || '-'
            ];

            doc.setTextColor(0, 0, 0);
            rowData.forEach((cell, i) => {
              const cellText = String(cell);
              const cellAlign = i > 2 ? 'right' : 'left';
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
          doc.text(`Total Items: ${summary.total_items}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Quantity Sold: ${summary.total_quantity.toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Sales Value: ${summary.total_sales.toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Total Tax Value: ${summary.total_tax.toFixed(2)}`, 14, yPos);
          yPos += 6;
          doc.text(`Average Unit Price: ${summary.avg_price.toFixed(2)}`, 14, yPos);

          // Get PDF as blob
          const pdfBlob = doc.output('blob');

          return new Response(pdfBlob, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="item-wise-sales-summary-${new Date().toISOString().split('T')[0]}.pdf"`
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
      data: paginatedData,
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
        itemType
      }
    });

  } catch (error) {
    console.error('Error in item-wise sales summary report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}