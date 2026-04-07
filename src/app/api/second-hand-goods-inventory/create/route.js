import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      goodsName, 
      goodsDescription, 
      unitId, 
      unitPrice, 
      quantity, 
      status 
    } = body;

    // Validate required fields
    if (!goodsName) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Goods Name is required." 
      }), { status: 400 });
    }

    if (!unitPrice || unitPrice <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Valid Unit Price is required." 
      }), { status: 400 });
    }

    if (!quantity || quantity <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Valid Quantity is required." 
      }), { status: 400 });
    }

    // Verify unit exists if provided
    if (unitId) {
      const unit = await prisma.Unit.findUnique({
        where: { id: parseInt(unitId) }
      });
      if (!unit) {
        return new Response(JSON.stringify({
          success: false,
          error: "Unit not found."
        }), { status: 404 });
      }
    }

    // Calculate inventory value
    const inventoryValue = parseFloat(unitPrice) * parseFloat(quantity);

    // Create new record
    const inventory = await prisma.secondHandGoodsInventory.create({
      data: {
        goodsName,
        goodsDescription: goodsDescription || null,
        unitId: unitId ? parseInt(unitId) : null,
        unitPrice: parseFloat(unitPrice),
        quantity: parseFloat(quantity),
        inventoryValue: inventoryValue,
        status: status ?? "A" // default Active
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Inventory item created successfully",
      inventory
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

