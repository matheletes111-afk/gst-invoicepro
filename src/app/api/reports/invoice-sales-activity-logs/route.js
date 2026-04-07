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
    const invoiceNo = searchParams.get('invoice_no');
    const exportType = searchParams.get('export');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    // Get specific invoice audit trail
    const getInvoiceAudit = searchParams.get('invoice_audit');
    const salesId = searchParams.get('sales_id');

    // Helper function to parse JSON payload
    const parsePayload = (payload) => {
      if (!payload) return {};
      try {
        if (typeof payload === 'string') {
          try {
            return JSON.parse(payload);
          } catch {
            // Try double-encoded JSON
            return JSON.parse(JSON.parse(payload));
          }
        }
        return payload;
      } catch (error) {
        console.error('Error parsing payload:', error);
        return {};
      }
    };

    // Helper function to check if payload contains sales_id
    const payloadContainsSalesId = (payload, salesId) => {
      if (!payload || !salesId) return false;

      try {
        const parsed = parsePayload(payload);
        return parsed.sales_id === parseInt(salesId) || parsed.id === parseInt(salesId);
      } catch (error) {
        return false;
      }
    };

    // Helper function to extract invoice number
    const extractInvoiceNo = (payload) => {
      if (!payload) return 'N/A';

      try {
        const parsed = parsePayload(payload);
        return parsed.sales_invoice_no || parsed.invoice_no || 'N/A';
      } catch (error) {
        return 'N/A';
      }
    };

    // Helper function to extract customer name
    const extractCustomerName = (payload) => {
      if (!payload) return 'N/A';

      try {
        const parsed = parsePayload(payload);
        return parsed.customer_name || 'N/A';
      } catch (error) {
        return 'N/A';
      }
    };

    // Helper function to extract total amount
    const extractTotalAmount = (payload) => {
      if (!payload) return 0;

      try {
        const parsed = parsePayload(payload);
        return parsed.total_invoice_amount || parsed.total_amount || 0;
      } catch (error) {
        return 0;
      }
    };

    // For main list: Show only CREATE actions
    if (getInvoiceAudit !== 'true') {
      // Build where clause for CREATE actions only
      const where = {
        module: 'sales',
        action: 'CREATE'
      };

      // Date range filter
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      // Get total count for pagination
      const totalCount = await prisma.activityLog.count({
        where
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      // Fetch CREATE activity logs with user data
      const createActivities = await prisma.activityLog.findMany({
        where,
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      // Process CREATE activities and get UPDATE counts
      const processedData = await Promise.all(
        createActivities.map(async (activity) => {
          const parsedPayload = parsePayload(activity.payload);
          const salesId = parsedPayload.sales_id || parsedPayload.id;
          const invoiceNo = extractInvoiceNo(activity.payload);
          const customerName = extractCustomerName(activity.payload);
          const totalAmount = extractTotalAmount(activity.payload);

          // Get UPDATE count for this sales_id - FIXED SYNTAX
          let updateCount = 0;
          if (salesId) {
            // Fetch all UPDATE activities and filter manually
            const allUpdateActivities = await prisma.activityLog.findMany({
              where: {
                module: 'sales',
                action: 'UPDATE'
              },
              select: {
                payload: true
              }
            });

            // Filter activities that contain this sales_id
            updateCount = allUpdateActivities.filter(updateActivity => {
              return payloadContainsSalesId(updateActivity.payload, salesId);
            }).length;
          }

          return {
            id: activity.id,
            userId: activity.userId,
            userName: activity.user?.name || 'Unknown User',
            userEmail: activity.user?.email || 'No email',
            userRole: activity.user?.role,
            action: activity.action,
            module: activity.module,
            description: activity.description,
            payload: parsedPayload,
            invoiceNo: invoiceNo,
            salesId: salesId,
            customerName: customerName,
            customerTPN: parsedPayload.customer_tpn || 'N/A',
            totalAmount: totalAmount,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            timestamp: activity.createdAt,
            updateCount: updateCount
          };
        })
      );

      // Filter by search if provided
      let filteredData = processedData;
      if (search) {
        filteredData = processedData.filter(item =>
          item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          item.customerName.toLowerCase().includes(search.toLowerCase()) ||
          item.userName.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase()) ||
          false
        );
      }

      // Get summary statistics
      const allCreateActivities = await prisma.activityLog.findMany({
        where: {
          module: 'sales',
          action: 'CREATE',
          ...(fromDate || toDate ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {})
            }
          } : {})
        },
        select: {
          payload: true
        }
      });

      // Get all UPDATE activities for summary
      const allUpdateActivities = await prisma.activityLog.findMany({
        where: {
          module: 'sales',
          action: 'UPDATE',
          ...(fromDate || toDate ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {})
            }
          } : {})
        }
      });

      const uniqueInvoiceNos = new Set();
      allCreateActivities.forEach(activity => {
        const invoiceNo = extractInvoiceNo(activity.payload);
        if (invoiceNo && invoiceNo !== 'N/A') {
          uniqueInvoiceNos.add(invoiceNo);
        }
      });

      const summary = {
        total_invoices: filteredData.length,
        unique_invoices: uniqueInvoiceNos.size,
        total_updates: allUpdateActivities.length,
        average_updates: filteredData.length > 0 ?
          (allUpdateActivities.length / filteredData.length).toFixed(1) : 0
      };

      // Handle export requests
      if (exportType === 'csv' || exportType === 'pdf') {
        const exportActivities = await prisma.activityLog.findMany({
          where,
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const exportData = await Promise.all(
          exportActivities.map(async (activity) => {
            const parsedPayload = parsePayload(activity.payload);
            const salesId = parsedPayload.sales_id || parsedPayload.id;
            const invoiceNo = extractInvoiceNo(activity.payload);
            const customerName = extractCustomerName(activity.payload);
            const totalAmount = extractTotalAmount(activity.payload);

            // Get UPDATE count for this sales_id
            let updateCount = 0;
            if (salesId) {
              const allUpdateActivities = await prisma.activityLog.findMany({
                where: {
                  module: 'sales',
                  action: 'UPDATE'
                },
                select: {
                  payload: true
                }
              });

              updateCount = allUpdateActivities.filter(updateActivity => {
                return payloadContainsSalesId(updateActivity.payload, salesId);
              }).length;
            }

            return {
              timestamp: activity.createdAt,
              invoiceNo: invoiceNo,
              action: activity.action,
              performedBy: activity.user?.name || 'System',
              userEmail: activity.user?.email || '',
              userRole: activity.user?.role || '',
              customerName: customerName,
              customerTPN: parsedPayload.customer_tpn || 'N/A',
              totalAmount: totalAmount,
              description: activity.description || '',
              ipAddress: activity.ipAddress || '',
              userAgent: activity.userAgent || '',
              updateCount: updateCount
            };
          })
        );

        if (exportType === 'csv') {
          const headers = [
            'Timestamp',
            'Invoice No.',
            'Action',
            'Performed By',
            'User Email',
            'Customer Name',
            'Total Amount',
            'Update Count',
            'Description',
            'IP Address'
          ];

          const csvRows = [
            headers.join(','),
            ...exportData.map(item => [
              `"${new Date(item.timestamp).toISOString()}"`,
              `"${item.invoiceNo}"`,
              `"${item.action}"`,
              `"${item.performedBy}"`,
              `"${item.userEmail}"`,
              `"${item.customerName}"`,
              `"${item.totalAmount || 0}"`,
              `"${item.updateCount}"`,
              `"${(item.description || '').replace(/"/g, '""')}"`,
              `"${item.ipAddress || ''}"`
            ].join(','))
          ];

          const csvContent = csvRows.join('\n');

          return new Response(csvContent, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="invoice-creation-log-${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        }

        if (exportType === 'pdf') {
          try {
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });

            // Title
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Invoice Creation Log Report', 14, 15);

            // Report generated info
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`Report generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);

            // Summary section
            let yPos = 30;
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Summary:', 14, yPos);

            yPos += 6;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`• Total Invoices Created: ${summary.total_invoices}`, 20, yPos);
            yPos += 5;
            doc.text(`• Unique Invoices: ${summary.unique_invoices}`, 20, yPos);
            yPos += 5;
            doc.text(`• Total Updates: ${summary.total_updates}`, 20, yPos);
            yPos += 5;
            doc.text(`• Average Updates per Invoice: ${summary.average_updates}`, 20, yPos);

            // Manual table generation
            yPos += 10;

            // Table headers
            const headers = [
              { text: 'Timestamp', width: 30 },
              { text: 'Invoice No.', width: 30 },
              { text: 'Performed By', width: 25 },
              { text: 'Customer', width: 25 },
              { text: 'Amount', width: 20 },
              { text: 'Updates', width: 15 }
            ];

            // Draw table header
            let xPos = 14;
            headers.forEach(header => {
              doc.setFillColor(0, 102, 204);
              doc.rect(xPos, yPos, header.width, 6, 'F');
              doc.setDrawColor(0, 102, 204);
              doc.rect(xPos, yPos, header.width, 6);
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(8);
              doc.setFont(undefined, 'bold');
              doc.text(header.text, xPos + 2, yPos + 4, { maxWidth: header.width - 4 });
              xPos += header.width;
            });

            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);

            yPos += 6;

            // Table rows
            exportData.forEach((item, index) => {
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
                xPos = 14;
                headers.forEach(header => {
                  doc.setFillColor(0, 102, 204);
                  doc.rect(xPos, yPos, header.width, 6, 'F');
                  doc.setDrawColor(0, 102, 204);
                  doc.rect(xPos, yPos, header.width, 6);
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(8);
                  doc.setFont(undefined, 'bold');
                  doc.text(header.text, xPos + 2, yPos + 4, { maxWidth: header.width - 4 });
                  xPos += header.width;
                });
                doc.setTextColor(0, 0, 0);
                yPos += 6;
              }

              if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                xPos = 14;
                headers.forEach(header => {
                  doc.rect(xPos, yPos, header.width, 6, 'F');
                  xPos += header.width;
                });
              }

              const rowData = [
                new Date(item.timestamp).toLocaleDateString(),
                item.invoiceNo.substring(0, 15),
                item.performedBy.substring(0, 12),
                item.customerName.substring(0, 12),
                item.totalAmount ? `$${item.totalAmount.toFixed(2)}` : '$0.00',
                item.updateCount.toString()
              ];

              xPos = 14;
              rowData.forEach((cell, i) => {
                doc.text(cell, xPos + 2, yPos + 4, { maxWidth: headers[i].width - 4 });
                xPos += headers[i].width;
              });

              xPos = 14;
              headers.forEach(header => {
                doc.setDrawColor(200, 200, 200);
                doc.rect(xPos, yPos, header.width, 6);
                xPos += header.width;
              });

              yPos += 6;
            });

            const totalPagesCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPagesCount; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.text(
                `Page ${i} of ${totalPagesCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
              );
            }

            const pdfBlob = doc.output('blob');
            return new Response(pdfBlob, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-creation-log-${new Date().toISOString().split('T')[0]}.pdf"`
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

      return NextResponse.json({
        success: true,
        data: filteredData,
        summary,
        pagination: {
          page,
          limit,
          totalCount: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
          hasNextPage: page < Math.ceil(filteredData.length / limit),
          hasPreviousPage: page > 1
        },
        filters: {
          fromDate,
          toDate,
          search,
          invoiceNo
        }
      });
    }

    // Get specific invoice audit trail (for modal)
    if (getInvoiceAudit === 'true' && salesId) {
      // Fetch all sales activities first
      const allSalesActivities = await prisma.activityLog.findMany({
        where: {
          module: 'sales',
          action: {
            in: ['CREATE', 'UPDATE', 'DELETE']
          }
        },
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'asc' // Chronological order
        }
      });

      // Filter activities for this specific sales_id
      const invoiceActivities = allSalesActivities.filter(activity =>
        payloadContainsSalesId(activity.payload, salesId)
      );

      if (invoiceActivities.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No activities found for this invoice'
        }, { status: 404 });
      }

      // Format audit trail
      const formattedAuditTrail = invoiceActivities.map(log => {
        const parsedPayload = parsePayload(log.payload);

        return {
          id: log.id,
          action: log.action,
          module: log.module,
          description: log.description,
          performedBy: log.user ? `${log.user.name} (${log.user.email})` : 'System',
          userId: log.userId,
          userName: log.user?.name,
          userEmail: log.user?.email,
          timestamp: log.createdAt,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          payload: parsedPayload,
          invoiceNo: extractInvoiceNo(log.payload),
          salesId: parsedPayload.sales_id || parsedPayload.id,
          customerName: extractCustomerName(log.payload),
          totalAmount: extractTotalAmount(log.payload),
          items: parsedPayload.items || []
        };
      });

      // Find the CREATE action (first in timeline)
      const createAction = formattedAuditTrail.find(log => log.action === 'CREATE');
      const updateActions = formattedAuditTrail.filter(log => log.action === 'UPDATE');
      const deleteAction = formattedAuditTrail.find(log => log.action === 'DELETE');

      // Get invoice details from CREATE action
      const invoiceDetails = createAction ? {
        invoiceNo: createAction.invoiceNo,
        salesId: createAction.salesId,
        createdBy: createAction.performedBy,
        createdAt: createAction.timestamp,
        initialAmount: createAction.totalAmount,
        customerName: createAction.customerName,
        customerTPN: createAction.payload?.customer_tpn || 'N/A',
        initialPayload: createAction.payload
      } : null;

      return NextResponse.json({
        success: true,
        auditTrail: formattedAuditTrail,
        createAction: createAction,
        updateActions: updateActions,
        deleteAction: deleteAction,
        timeline: formattedAuditTrail.map(log => ({
          id: log.id,
          action: log.action,
          performedBy: log.performedBy,
          timestamp: log.timestamp,
          description: log.description,
          totalAmount: log.totalAmount,
          items: log.items
        })),
        summary: {
          totalActions: formattedAuditTrail.length,
          createCount: createAction ? 1 : 0,
          updateCount: updateActions.length,
          deleteCount: deleteAction ? 1 : 0,
          firstActivity: formattedAuditTrail[0]?.timestamp,
          lastActivity: formattedAuditTrail[formattedAuditTrail.length - 1]?.timestamp
        },
        invoiceDetails: invoiceDetails
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in invoice sales activity log report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}