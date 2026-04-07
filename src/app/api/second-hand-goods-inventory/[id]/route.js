import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const inventory = await prisma.secondHandGoodsInventory.findUnique({
      where: { inventoryId: Number(params.id) },
      include: {
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!inventory || inventory.status === "D") {
      return Response.json({ error: "Inventory item not found" }, { status: 404 });
    }

    return Response.json({ success: true, inventory });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

