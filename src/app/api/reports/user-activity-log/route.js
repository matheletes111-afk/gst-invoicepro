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
    const action = searchParams.get('action');
    const module = searchParams.get('module');
    const exportType = searchParams.get('export');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    // Also extract modules and actions for dropdowns when needed
    const getOptions = searchParams.get('options');

    // Build where clause
    const where = {};

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

    // Action filter
    if (action && action !== 'ALL') {
      where.action = action;
    }

    // Module filter
    if (module && module !== 'ALL') {
      where.module = module;
    }

    // Search filter - search in user name, email, description, IP
    if (search) {
      where.OR = [
        { description: { contains: search, } },
        { ipAddress: { contains: search, } },
        { 
          user: {
            OR: [
              { name: { contains: search, } },
              { email: { contains: search, } }
            ]
          }
        }
      ];
    }

    // If only options are requested (for dropdowns)
    if (getOptions === 'true') {
      // Get all unique modules and actions from the database
      const [modules, actions] = await Promise.all([
        prisma.activityLog.findMany({
          select: {
            module: true
          },
          distinct: ['module'],
          
          orderBy: {
            module: 'asc'
          }
        }),
        prisma.activityLog.findMany({
          select: {
            action: true
          },
          distinct: ['action'],
         
          orderBy: {
            action: 'asc'
          }
        })
      ]);

      const uniqueModules = [...new Set(modules.map(m => m.module))].filter(Boolean).sort();
      const uniqueActions = [...new Set(actions.map(a => a.action))].filter(Boolean).sort();

      return NextResponse.json({
        success: true,
        modules: uniqueModules,
        actions: uniqueActions
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.activityLog.count({
      where
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch activity logs with user data (with pagination)
    const activities = await prisma.activityLog.findMany({
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

    // Get ALL activities for summary statistics (without pagination)
    const allActivitiesForSummary = await prisma.activityLog.findMany({
      where,
      select: {
        userId: true,
        action: true
      }
    });

    // Calculate summary statistics from ALL filtered data
    const uniqueUserIds = new Set();
    let loginCount = 0;
    let createCount = 0;
    let updateCount = 0;
    let deleteCount = 0;
    let viewCount = 0;
    let otherCount = 0;

    allActivitiesForSummary.forEach(activity => {
      if (activity.userId) {
        uniqueUserIds.add(activity.userId);
      }
      
      if (activity.action === 'LOGIN') {
        loginCount++;
      } else if (activity.action === 'CREATE') {
        createCount++;
      } else if (activity.action === 'UPDATE') {
        updateCount++;
      } else if (activity.action === 'DELETE' || activity.action === 'DELETED') {
        deleteCount++;
      } else if (activity.action === 'VIEW') {
        viewCount++;
      } else {
        otherCount++;
      }
    });

    const summary = {
      total_activities: totalCount,
      unique_users: uniqueUserIds.size,
      logins: loginCount,
      creates: createCount,
      updates: updateCount,
      deletes: deleteCount,
      views: viewCount,
      others: otherCount
    };

    // Format data for response
    const formattedData = activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.user?.name || 'Unknown User',
      userEmail: activity.user?.email || 'No email',
      userRole: activity.user?.role,
      action: activity.action,
      module: activity.module,
      description: activity.description,
      payload: activity.payload,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt
    }));

    // Handle export requests (no pagination for exports)
    if (exportType === 'csv' || exportType === 'pdf') {
      // For exports, fetch all data without pagination (up to 1000 limit)
      const exportActivities = await prisma.activityLog.findMany({
        where,
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000 // Limit for performance
      });

      const exportFormattedData = exportActivities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        userName: activity.user?.name || 'Unknown User',
        userEmail: activity.user?.email || 'No email',
        userRole: activity.user?.role,
        action: activity.action,
        module: activity.module,
        description: activity.description,
        payload: activity.payload,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        createdAt: activity.createdAt
      }));

      if (exportType === 'csv') {
        const headers = [
          'Timestamp',
          'User ID',
          'User Name',
          'User Email',
          'User Role',
          'Action',
          'Module',
          'Description',
          'Payload (JSON)',
          'IP Address',
          'User Agent'
        ];

        const csvRows = [
          headers.join(','),
          ...exportFormattedData.map(activity => [
            `"${new Date(activity.createdAt).toISOString()}"`,
            activity.userId || '',
            `"${activity.userName || ''}"`,
            `"${activity.userEmail || ''}"`,
            `"${activity.userRole || ''}"`,
            `"${activity.action}"`,
            `"${activity.module}"`,
            `"${(activity.description || '').replace(/"/g, '""')}"`,
            `"${activity.payload ? JSON.stringify(activity.payload).replace(/"/g, '""') : ''}"`,
            `"${activity.ipAddress || ''}"`,
            `"${(activity.userAgent || '').replace(/"/g, '""')}"`
          ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="user-activity-log-${new Date().toISOString().split('T')[0]}.csv"`
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
          doc.setFont(undefined, 'bold');
          doc.text('User Activity Log Report', 14, 15);

          // Report generated info
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(`Report generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);

          // Filter info
          let yPos = 30;
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('Filters Applied:', 14, yPos);
          
          yPos += 7;
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          
          if (fromDate) {
            doc.text(`• From Date: ${new Date(fromDate).toLocaleDateString()}`, 20, yPos);
            yPos += 5;
          }
          if (toDate) {
            doc.text(`• To Date: ${new Date(toDate).toLocaleDateString()}`, 20, yPos);
            yPos += 5;
          }
          if (action && action !== 'ALL') {
            doc.text(`• Action: ${action}`, 20, yPos);
            yPos += 5;
          }
          if (module && module !== 'ALL') {
            doc.text(`• Module: ${module}`, 20, yPos);
            yPos += 5;
          }
          if (search) {
            doc.text(`• Search: ${search}`, 20, yPos);
            yPos += 5;
          }

          // Summary section - use the full summary from all filtered data
          yPos += 5;
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text('Summary:', 14, yPos);
          
          yPos += 6;
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.text(`• Total Activities: ${summary.total_activities}`, 20, yPos);
          yPos += 5;
          doc.text(`• Unique Users: ${summary.unique_users}`, 20, yPos);
          yPos += 5;
          doc.text(`• Login Activities: ${summary.logins}`, 20, yPos);
          yPos += 5;
          doc.text(`• Data Changes: ${summary.creates + summary.updates + summary.deletes}`, 20, yPos);

          // Add a new page for the table
          doc.addPage();

          // Table headers
          const headers = [
            'Timestamp',
            'User Name',
            'User Email',
            'Action',
            'Module',
            'Description',
            'IP Address',
            'Payload (JSON)'
          ];
          
          // Column widths (in mm)
          const colWidths = [30, 25, 35, 20, 25, 40, 25, 70];
          const rowHeight = 6;
          const leftMargin = 10;
          
          // Draw table header
          let xPos = leftMargin;
          headers.forEach((header, i) => {
            // Header background
            doc.setFillColor(0, 102, 204);
            doc.rect(xPos, 10, colWidths[i], rowHeight, 'F');
            
            // Header border
            doc.setDrawColor(0, 102, 204);
            doc.rect(xPos, 10, colWidths[i], rowHeight);
            
            // Header text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text(header, xPos + 1, 13.5, { 
              maxWidth: colWidths[i] - 2,
              align: 'left'
            });
            xPos += colWidths[i];
          });
          
          // Draw rows
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(7);
          
          let currentY = 10 + rowHeight;
          let pageNumber = 1;
          
          exportFormattedData.forEach((activity, idx) => {
            // Check if we need a new page (with some margin)
            if (currentY + rowHeight > 270) {
              doc.addPage();
              currentY = 10;
              pageNumber++;
              
              // Redraw header on new page
              xPos = leftMargin;
              headers.forEach((header, i) => {
                doc.setFillColor(0, 102, 204);
                doc.rect(xPos, currentY, colWidths[i], rowHeight, 'F');
                doc.setDrawColor(0, 102, 204);
                doc.rect(xPos, currentY, colWidths[i], rowHeight);
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.text(header, xPos + 1, currentY + 3.5, { 
                  maxWidth: colWidths[i] - 2,
                  align: 'left'
                });
                xPos += colWidths[i];
              });
              currentY += rowHeight;
              doc.setTextColor(0, 0, 0);
              doc.setFont(undefined, 'normal');
              doc.setFontSize(7);
            }

            // Alternate row color
            if (idx % 2 === 0) {
              doc.setFillColor(245, 245, 245);
              let xPos = leftMargin;
              colWidths.forEach(width => {
                doc.rect(xPos, currentY, width, rowHeight, 'F');
                xPos += width;
              });
            }

            // Prepare row data
            const rowData = [
              new Date(activity.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              (activity.userName || 'System').substring(0, 20),
              (activity.userEmail || 'N/A').substring(0, 25),
              activity.action,
              activity.module?.substring(0, 15) || 'N/A',
              (activity.description || 'No description').substring(0, 40),
              activity.ipAddress?.substring(0, 15) || 'N/A',
              activity.payload ? JSON.stringify(activity.payload).substring(0, 80) : 'No payload'
            ];

            // Draw row data
            xPos = leftMargin;
            rowData.forEach((cell, i) => {
              const cellText = String(cell);
              
              // For payload column, allow multiple lines
              if (i === 7 && cellText.length > 80) {
                const lines = doc.splitTextToSize(cellText, colWidths[i] - 2);
                doc.text(lines, xPos + 1, currentY + 3.5, { 
                  maxWidth: colWidths[i] - 2,
                  align: 'left'
                });
              } else {
                doc.text(cellText, xPos + 1, currentY + 3.5, { 
                  maxWidth: colWidths[i] - 2,
                  align: 'left'
                });
              }
              
              xPos += colWidths[i];
            });

            // Draw cell borders
            xPos = leftMargin;
            colWidths.forEach(width => {
              doc.setDrawColor(200, 200, 200);
              doc.rect(xPos, currentY, width, rowHeight);
              xPos += width;
            });

            currentY += rowHeight;
            
            // Adjust row height for multi-line payload
            if (activity.payload && JSON.stringify(activity.payload).length > 80) {
              const payloadText = JSON.stringify(activity.payload);
              const lines = Math.ceil(payloadText.length / 80);
              currentY += (lines - 1) * 3; // Additional space for extra lines
            }
          });

          // Add page numbers
          const totalPages = doc.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
              `Page ${i} of ${totalPages}`,
              doc.internal.pageSize.width / 2,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );
          }

          // Get PDF as blob
          const pdfBlob = doc.output('blob');

          return new Response(pdfBlob, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="user-activity-log-${new Date().toISOString().split('T')[0]}.pdf"`
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

    // Get ALL unique modules and actions from the ENTIRE filtered dataset for dropdowns
    // (not just from the current page)
    const [allModulesResult, allActionsResult] = await Promise.all([
      prisma.activityLog.findMany({
        select: {
          module: true
        },
        distinct: ['module'],
        where: {
          ...where,
         
        },
        orderBy: {
          module: 'asc'
        }
      }),
      prisma.activityLog.findMany({
        select: {
          action: true
        },
        distinct: ['action'],
        where: {
          ...where,
         
        },
        orderBy: {
          action: 'asc'
        }
      })
    ]);

    const allModules = [...new Set(allModulesResult.map(m => m.module))].filter(Boolean).sort();
    const allActions = [...new Set(allActionsResult.map(a => a.action))].filter(Boolean).sort();

    // Also get unique modules and actions from current page data (if needed)
    const currentPageModules = [...new Set(formattedData.map(item => item.module).filter(Boolean))].sort();
    const currentPageActions = [...new Set(formattedData.map(item => item.action).filter(Boolean))].sort();

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
      // Include ALL modules and actions from filtered dataset for dropdowns
      allModules: allModules,
      allActions: allActions,
      // Also include current page modules/actions if needed
      currentPageModules: currentPageModules,
      currentPageActions: currentPageActions,
      filters: {
        fromDate,
        toDate,
        search,
        action,
        module
      }
    });

  } catch (error) {
    console.error('Error in user activity log report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}