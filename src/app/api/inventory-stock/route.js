import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

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
    
    // Pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Search and Filters
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // 'GOODS' or 'SERVICE'
    const minQty = searchParams.get("min_qty");
    const maxQty = searchParams.get("max_qty");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const sortBy = searchParams.get("sortBy") || "item_name";
    const sortDir = searchParams.get("sortDir") || "asc";

    // Build where clause for inventory items
    let where = {
      organization_id: parseInt(organizationId),
      OR: [
        { goods_id: { not: null } },
        { service_id: { not: null } }
      ]
    };

    // Add search condition if provided
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          {
            goods: {
              goodsName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            service: {
              service_name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ]
      });
    }

    // Filter by type
    if (type === 'GOODS') {
      where.goods_id = { not: null };
      delete where.OR; // Remove OR clause since we only want goods
    } else if (type === 'SERVICE') {
      where.service_id = { not: null };
      delete where.OR; // Remove OR clause since we only want services
    }

    // Filter by quantity range
    if (minQty || maxQty) {
      where.qty = {};
      if (minQty) where.qty.gte = parseFloat(minQty);
      if (maxQty) where.qty.lte = parseFloat(maxQty);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // First, get all inventory items with their relations
    const inventoryItems = await prisma.inventoryMaster.findMany({
      where,
      include: {
        goods: {
          select: {
            goodsId: true,
            goodsName: true,
            goodsCode: true
          }
        },
        service: {
          select: {
            service_id: true,
            service_name: true,
            service_code: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        organization: {
          select: {
            id: true,
            orgType: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Group items by goods_id or service_id
    const groupedItems = {};
    
    inventoryItems.forEach(item => {
      let itemId, itemType, itemName, itemCode;
      
      if (item.goods_id && item.goods) {
        // This is a GOODS item
        itemId = item.goods_id;
        itemType = 'GOODS';
        itemName = item.goods.goodsName;
        itemCode = item.goods.goodsCode;
      } else if (item.service_id && item.service) {
        // This is a SERVICE item
        itemId = item.service_id;
        itemType = 'SERVICE';
        itemName = item.service.service_name;
        itemCode = item.service.service_code;
      } else {
        // Skip items without valid goods or service
        return;
      }
      
      const unitName = item.unit?.name || 'Unit';

      if (!groupedItems[`${itemType}_${itemId}`]) {
        groupedItems[`${itemType}_${itemId}`] = {
          item_type: itemType,
          item_id: itemId,
          item_name: itemName,
          item_code: itemCode,
          unit_name: unitName,
          variants: [],
          total_qty: 0,
          total_inventory_value: 0
        };
      }

      // Add this variant to the group
      groupedItems[`${itemType}_${itemId}`].variants.push({
        inventory_id: item.id,
        price: parseFloat(item.price),
        qty: parseFloat(item.qty),
        inventory_amount: parseFloat(item.inventory_amount),
        created_at: item.created_at,
        unit_name: unitName
      });

      // Update totals
      groupedItems[`${itemType}_${itemId}`].total_qty += parseFloat(item.qty);
      groupedItems[`${itemType}_${itemId}`].total_inventory_value += parseFloat(item.inventory_amount);
    });

    // Convert grouped items to array
    let groupedItemsArray = Object.values(groupedItems);
    
    // Apply sorting to grouped items
    if (sortBy === 'item_name') {
      groupedItemsArray.sort((a, b) => {
        const nameA = a.item_name.toLowerCase();
        const nameB = b.item_name.toLowerCase();
        return sortDir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (sortBy === 'total_qty') {
      groupedItemsArray.sort((a, b) => 
        sortDir === 'asc' ? a.total_qty - b.total_qty : b.total_qty - a.total_qty
      );
    } else if (sortBy === 'total_value') {
      groupedItemsArray.sort((a, b) => 
        sortDir === 'asc' ? a.total_inventory_value - b.total_inventory_value : b.total_inventory_value - a.total_inventory_value
      );
    }

    // Apply pagination
    const total = groupedItemsArray.length;
    const paginatedItems = groupedItemsArray.slice(skip, skip + limit);

    // Add price variants count to each group
    paginatedItems.forEach(item => {
      item.price_variants = item.variants.length;
      item.variants.sort((a, b) => b.price - a.price); // Sort variants by price descending
    });

    // Calculate overall totals
    const overallTotals = {
      total_items: total,
      total_qty: groupedItemsArray.reduce((sum, item) => sum + item.total_qty, 0),
      total_value: groupedItemsArray.reduce((sum, item) => sum + item.total_inventory_value, 0),
      total_variants: groupedItemsArray.reduce((sum, item) => sum + item.variants.length, 0),
      goods_count: groupedItemsArray.filter(item => item.item_type === 'GOODS').length,
      services_count: groupedItemsArray.filter(item => item.item_type === 'SERVICE').length
    };

    return Response.json({
      success: true,
      data: paginatedItems,
      totals: overallTotals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching inventory stock:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}