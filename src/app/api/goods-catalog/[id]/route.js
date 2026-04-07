import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const goods = await prisma.GoodsCatalog.findUnique({
      where: { goodsId: Number(params.id) },
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
    if (!goods || goods.status === "D") {
      return Response.json({ error: "Goods not found" }, { status: 404 });
    }

    return Response.json({ success: true, goods });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

