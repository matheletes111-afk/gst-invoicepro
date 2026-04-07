import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      id,
      goodsName, 
      goodsDescription, 
      unitId, 
      unitPrice, 
      quantity, 
      status 
    } = body;

    if (!id) {
      return Response.json({ error: "Inventory ID is required" }, { status: 400 });
    }

    // Verify unit exists if provided
    if (unitId) {
      const unit = await prisma.Unit.findUnique({
        where: { id: parseInt(unitId) }
      });
      if (!unit) {
        return Response.json({
          error: "Unit not found."
        }, { status: 404 });
      }
    }

    // Update Inventory
    const updateData = {};
    if (goodsName) updateData.goodsName = goodsName;
    if (goodsDescription !== undefined) updateData.goodsDescription = goodsDescription || null;
    if (unitId !== undefined) updateData.unitId = unitId ? parseInt(unitId) : null;
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (status) updateData.status = status;

    // Recalculate inventory value if unitPrice or quantity changed
    if (unitPrice !== undefined || quantity !== undefined) {
      const current = await prisma.secondHandGoodsInventory.findUnique({
        where: { inventoryId: Number(id) }
      });
      const finalUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : current.unitPrice;
      const finalQuantity = quantity !== undefined ? parseFloat(quantity) : current.quantity;
      updateData.inventoryValue = finalUnitPrice * finalQuantity;
    }

    const inventory = await prisma.secondHandGoodsInventory.update({
      where: { inventoryId: Number(id) },
      data: updateData
    });

    return Response.json({ success: true, inventory });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

