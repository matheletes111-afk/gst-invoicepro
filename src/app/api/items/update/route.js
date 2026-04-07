import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, itemType, name, code, desc, price, unit,status } = body;

    if (!id) {
      return Response.json({ error: "Item ID is required" }, { status: 400 });
    }

    // Use `itemId` in where clause, because your schema uses itemId as primary key
    const item = await prisma.item.update({
      where: { itemId: parseInt(id) }, 
      data: { itemType, name, code, desc, price, unit,status },
    });

    return Response.json({ success: true, item });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
