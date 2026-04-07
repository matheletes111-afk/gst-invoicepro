import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOrganizationIdFromRequest } from '@/lib/auth';

// Helper to get record name from payload
const getRecordName = (payload, module) => {
  if (!payload) return 'Unknown';

  try {
    let parsedPayload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        try {
          parsedPayload = JSON.parse(JSON.parse(payload));
        } catch {
          return 'Unknown';
        }
      }
    } else {
      parsedPayload = payload;
    }

    // Try different naming conventions based on module
    const possibleNameFields = ['name', 'title', 'slabName', 'service_name', 'goodsName', 'currencyName', 'supplierName', 'dealerName'];

    for (const field of possibleNameFields) {
      if (parsedPayload[field] !== undefined) {
        return String(parsedPayload[field]);
      }
    }

    // Try ID fields
    const idFields = ['id', 'unitId', 'dzongkhagId', 'gewogId', 'villageId', 'slabId', 'rateId', 'mappingId', 'currencyId', 'exchangeId', 'service_id', 'goodsId', 'supplierId', 'dealerId'];

    for (const field of idFields) {
      if (parsedPayload[field] !== undefined) {
        return `${module.toUpperCase()}-${parsedPayload[field]}`;
      }
    }

    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

// Helper to get record ID from payload
const getRecordId = (payload) => {
  if (!payload) return null;

  try {
    let parsedPayload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        try {
          parsedPayload = JSON.parse(JSON.parse(payload));
        } catch {
          return null;
        }
      }
    } else {
      parsedPayload = payload;
    }

    // Try different ID field names
    const idFields = ['id', 'unitId', 'dzongkhagId', 'gewogId', 'villageId', 'slabId', 'rateId', 'mappingId', 'currencyId', 'exchangeId', 'service_id', 'goodsId', 'supplierId', 'dealerId'];

    for (const field of idFields) {
      if (parsedPayload[field] !== undefined) {
        return parsedPayload[field];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Helper to format master data type name
const formatMasterDataType = (module) => {
  const moduleMap = {
    'unit': 'Unit of Measurement',
    'dzongkhag': 'Dzongkhag',
    'gewog': 'Gewog',
    'village': 'Village',
    'gst-rate-slabs-api': 'GST Rate Slab',
    'gst-rate': 'GST Rate',
    'map-gst-rates': 'GST Rate Mapping',
    'currency': 'Currency',
    'exchange-rate': 'Exchange Rate',
    'service-catalog': 'Service Catalog',
    'goods-catalog': 'Goods Catalog',
    'supplier': 'Supplier',
    'dealer': 'Dealer'
  };

  return moduleMap[module] || module.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper to extract key values from payload
const extractKeyValues = (payload) => {
  if (!payload) return {};

  try {
    let parsedPayload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        try {
          parsedPayload = JSON.parse(JSON.parse(payload));
        } catch {
          return {};
        }
      }
    } else {
      parsedPayload = payload;
    }

    const keyValues = {};

    // Extract important fields
    const importantFields = [
      'name', 'title', 'slabName', 'service_name', 'goodsName', 'currencyName',
      'supplierName', 'dealerName', 'code', 'description', 'status',
      'startRange', 'endRange', 'gstRate', 'exchangeRate', 'effectiveDate',
      'goodsPrice', 'unitId', 'currencyId', 'slabId', 'rateId',
      'businessLicenseNo', 'contactName', 'contactEmail', 'contactPhone'
    ];

    for (const field of importantFields) {
      if (parsedPayload[field] !== undefined) {
        keyValues[field] = parsedPayload[field];
      }
    }

    return keyValues;
  } catch (error) {
    return {};
  }
};

// Helper to check if payload contains search text
const payloadContainsSearch = (payload, search) => {
  if (!payload || !search) return false;

  try {
    // Convert payload to string for searching
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return payloadStr.toLowerCase().includes(search.toLowerCase());
  } catch (error) {
    return false;
  }
};

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
    const masterDataType = searchParams.get('master_data_type');
    const recordId = searchParams.get('record_id');
    const exportType = searchParams.get('export');
    const getOptions = searchParams.get('options');
    const getRecordHistory = searchParams.get('record_history');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Define master data modules (excluding party and organization)
    const MASTER_DATA_MODULES = [
      'unit', 'dzongkhag', 'gewog', 'village',
      'gst-rate-slabs-api', 'gst-rate', 'map-gst-rates',
      'currency', 'exchange-rate', 'service-catalog',
      'goods-catalog', 'supplier', 'dealer'
    ];

    // If record history is requested
    if (getRecordHistory && recordId && masterDataType) {
      // Fetch all activities for this module first
      const allModuleActivities = await prisma.activityLog.findMany({
        where: {
          module: masterDataType,
          action: {
            in: ['CREATE', 'UPDATE', 'DELETE', 'DELETED']
          }
        },
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Filter activities for the specific record ID
      const recordActivities = [];
      let createActivity = null;

      for (const activity of allModuleActivities) {
        const activityRecordId = getRecordId(activity.payload);
        if (String(activityRecordId) === String(recordId)) {
          recordActivities.push({
            id: activity.id,
            action: activity.action,
            payload: activity.payload,
            timestamp: activity.createdAt,
            changedBy: activity.user?.name || 'System',
            changedByEmail: activity.user?.email || '',
            description: activity.description
          });

          if (activity.action === 'CREATE') {
            createActivity = {
              id: activity.id,
              action: activity.action,
              payload: activity.payload,
              timestamp: activity.createdAt,
              changedBy: activity.user?.name || 'System',
              changedByEmail: activity.user?.email || '',
              description: activity.description
            };
          }
        }
      }

      return NextResponse.json({
        success: true,
        createActivity,
        updateActivities: recordActivities.filter(a => a.action === 'UPDATE'),
        deleteActivity: recordActivities.find(a => a.action === 'DELETE' || a.action === 'DELETED'),
        allActivities: recordActivities
      });
    }

    // Build base where clause for main report
    const baseWhere = {
      module: {
        in: MASTER_DATA_MODULES
      },
      action: 'CREATE' // Only show CREATE actions in main table
    };

    // Add date range filter to base where
    if (fromDate || toDate) {
      baseWhere.createdAt = {};

      if (fromDate) {
        // Convert fromDate to start of day (00:00:00.000)
        const fromDateTime = new Date(fromDate);
        fromDateTime.setHours(0, 0, 0, 0);
        baseWhere.createdAt.gte = fromDateTime;
      }

      if (toDate) {
        // Convert toDate to end of day (23:59:59.999)
        const toDateTime = new Date(toDate);
        toDateTime.setHours(23, 59, 59, 999);
        baseWhere.createdAt.lte = toDateTime;
      }
    }

    // Master data type filter
    if (masterDataType && masterDataType !== 'ALL') {
      baseWhere.module = masterDataType;
    }

    // If only options are requested (for dropdowns)
    if (getOptions === 'true') {
      // Get all unique modules from master data
      const modules = await prisma.activityLog.findMany({
        select: {
          module: true
        },
        distinct: ['module'],
        where: {
          module: { in: MASTER_DATA_MODULES }
        },
        orderBy: {
          module: 'asc'
        }
      });

      const uniqueModules = [...new Set(modules.map(m => m.module))].filter(Boolean).sort();

      return NextResponse.json({
        success: true,
        modules: uniqueModules
      });
    }

    // Fetch total count for pagination
    const totalCount = await prisma.activityLog.count({
      where: baseWhere
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated CREATE activities (with date filters applied)
    const paginatedCreateActivities = await prisma.activityLog.findMany({
      where: baseWhere,
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limit
    });

    // Debug log for date filtering
    console.log('Date filter debug:', {
      fromDate,
      toDate,
      baseWhereCreatedAt: baseWhere.createdAt,
      resultCount: paginatedCreateActivities.length,
      totalCount: totalCount,
      page: page,
      limit: limit,
      skip: skip
    });

    // If there's a search query, filter the results
    let filteredActivities = paginatedCreateActivities;
    if (search) {
      filteredActivities = paginatedCreateActivities.filter(activity => {
        // Check description
        if (activity.description && activity.description.toLowerCase().includes(search.toLowerCase())) {
          return true;
        }

        // Check user name/email
        if (activity.user) {
          if (activity.user.name && activity.user.name.toLowerCase().includes(search.toLowerCase())) {
            return true;
          }
          if (activity.user.email && activity.user.email.toLowerCase().includes(search.toLowerCase())) {
            return true;
          }
        }

        // Check payload content
        if (payloadContainsSearch(activity.payload, search)) {
          return true;
        }

        return false;
      });
    }

    // Process CREATE activities
    const processedData = [];

    for (const activity of filteredActivities) {
      const recordName = getRecordName(activity.payload, activity.module);
      const recordIdValue = getRecordId(activity.payload);
      const keyValues = extractKeyValues(activity.payload);

      // Get all UPDATE activities for this module
      const allUpdateActivities = await prisma.activityLog.findMany({
        where: {
          module: activity.module,
          action: 'UPDATE'
        },
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Filter update activities specifically for this record
      const recordUpdates = [];
      for (const update of allUpdateActivities) {
        const updateRecordId = getRecordId(update.payload);
        if (String(updateRecordId) === String(recordIdValue)) {
          recordUpdates.push({
            id: update.id,
            timestamp: update.createdAt,
            payload: update.payload,
            changedBy: update.user?.name || 'System',
            changedByEmail: update.user?.email || '',
            description: update.description
          });
        }
      }

      // Format key values for display
      const displayValues = [];
      for (const [key, value] of Object.entries(keyValues)) {
        if (value !== null && value !== undefined) {
          const valueStr = String(value);
          displayValues.push(`${key}: ${valueStr.length > 30 ? valueStr.substring(0, 30) + '...' : valueStr}`);
        }
      }

      processedData.push({
        id: activity.id,
        masterDataType: formatMasterDataType(activity.module),
        module: activity.module,
        recordId: recordIdValue,
        recordName: recordName,
        keyValues: keyValues,
        displayValues: displayValues.slice(0, 3), // Show first 3 key values
        updateCount: recordUpdates.length,
        updateActivities: recordUpdates, // Store all update activities
        changedBy: activity.user?.name || 'System',
        changedByEmail: activity.user?.email || '',
        timestamp: activity.createdAt,
        description: activity.description,
        ipAddress: activity.ipAddress,
        createPayload: activity.payload // Store the create payload
      });
    }

    // Calculate summary statistics
    const summary = {
      total_creates: totalCount, // Use total count for accurate summary
      unique_master_types: await getUniqueMasterTypesCount(baseWhere),
      total_updates: await getTotalUpdatesCount(MASTER_DATA_MODULES, fromDate, toDate),
      unique_users: await getUniqueUsersCount(baseWhere),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    // Helper function to get unique master types count
    async function getUniqueMasterTypesCount(whereClause) {
      const uniqueModules = await prisma.activityLog.groupBy({
        by: ['module'],
        where: whereClause,
        _count: true
      });
      return uniqueModules.length;
    }

    // Helper function to get total updates count
    async function getTotalUpdatesCount(modules, fromDate, toDate) {
      const whereClause = {
        module: { in: modules },
        action: 'UPDATE'
      };

      if (fromDate || toDate) {
        whereClause.createdAt = {};
        if (fromDate) {
          const fromDateTime = new Date(fromDate);
          fromDateTime.setHours(0, 0, 0, 0);
          whereClause.createdAt.gte = fromDateTime;
        }
        if (toDate) {
          const toDateTime = new Date(toDate);
          toDateTime.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = toDateTime;
        }
      }

      return await prisma.activityLog.count({
        where: whereClause
      });
    }

    // Helper function to get unique users count
    async function getUniqueUsersCount(whereClause) {
      const activities = await prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: true
        }
      });

      const uniqueUserIds = [...new Set(activities.filter(a => a.userId).map(a => a.userId))];
      return uniqueUserIds.length;
    }

    // Handle export requests
    if (exportType === 'csv') {
      // For export, get ALL data without pagination
      const allCreateActivitiesForExport = await prisma.activityLog.findMany({
        where: baseWhere,
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Process all activities for export
      const allProcessedData = [];
      for (const activity of allCreateActivitiesForExport) {
        const recordName = getRecordName(activity.payload, activity.module);
        const recordIdValue = getRecordId(activity.payload);
        const keyValues = extractKeyValues(activity.payload);

        // Get all UPDATE activities for this module
        const allUpdateActivities = await prisma.activityLog.findMany({
          where: {
            module: activity.module,
            action: 'UPDATE'
          },
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        // Filter update activities specifically for this record
        const recordUpdates = [];
        for (const update of allUpdateActivities) {
          const updateRecordId = getRecordId(update.payload);
          if (String(updateRecordId) === String(recordIdValue)) {
            recordUpdates.push({
              id: update.id,
              timestamp: update.createdAt,
              payload: update.payload,
              changedBy: update.user?.name || 'System',
              changedByEmail: update.user?.email || '',
              description: update.description
            });
          }
        }

        allProcessedData.push({
          id: activity.id,
          masterDataType: formatMasterDataType(activity.module),
          module: activity.module,
          recordId: recordIdValue,
          recordName: recordName,
          keyValues: keyValues,
          displayValues: Object.entries(keyValues).slice(0, 3).map(([key, value]) =>
            `${key}: ${String(value).length > 30 ? String(value).substring(0, 30) + '...' : value}`
          ),
          updateCount: recordUpdates.length,
          updateActivities: recordUpdates,
          changedBy: activity.user?.name || 'System',
          changedByEmail: activity.user?.email || '',
          timestamp: activity.createdAt,
          description: activity.description,
          ipAddress: activity.ipAddress,
          createPayload: activity.payload
        });
      }

      const headers = [
        'Timestamp',
        'Master Data Type',
        'Record ID',
        'Record Name',
        'Created Values (JSON)',
        'Updated Values (JSON Array)',
        'Total Updates',
        'Created By',
        'Created By Email',
        'Description',
        'IP Address'
      ];

      const csvRows = [
        headers.join(','),
        ...allProcessedData.map(item => {
          // Format create payload
          let createPayload = '';
          try {
            createPayload = item.createPayload ?
              JSON.stringify(item.createPayload).replace(/"/g, '""') : '';
          } catch (error) {
            createPayload = 'ERROR_PARSING_CREATE_PAYLOAD';
          }

          // Format update payloads as JSON array
          let updatePayloads = '';
          try {
            if (item.updateActivities && item.updateActivities.length > 0) {
              const updatesArray = item.updateActivities.map(update => ({
                timestamp: update.timestamp,
                changedBy: update.changedBy,
                changedByEmail: update.changedByEmail,
                payload: update.payload
              }));
              updatePayloads = JSON.stringify(updatesArray).replace(/"/g, '""');
            }
          } catch (error) {
            updatePayloads = 'ERROR_PARSING_UPDATE_PAYLOADS';
          }

          return [
            `"${new Date(item.timestamp).toISOString()}"`,
            `"${item.masterDataType}"`,
            item.recordId ? `"${item.recordId}"` : '""',
            `"${String(item.recordName).replace(/"/g, '""')}"`,
            `"${createPayload}"`,
            `"${updatePayloads}"`,
            item.updateCount,
            `"${String(item.changedBy).replace(/"/g, '""')}"`,
            `"${String(item.changedByEmail).replace(/"/g, '""')}"`,
            `"${(item.description || '').replace(/"/g, '""')}"`,
            `"${item.ipAddress || ''}"`
          ].join(',');
        })
      ];

      const csvContent = csvRows.join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="data-create-log-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON response for normal requests
    return NextResponse.json({
      success: true,
      data: processedData,
      summary,
      pagination: {
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      // Also include all available modules for dropdowns
      allModules: MASTER_DATA_MODULES,
      filters: {
        fromDate,
        toDate,
        search,
        masterDataType
      }
    });

  } catch (error) {
    console.error('Error in data change log report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}