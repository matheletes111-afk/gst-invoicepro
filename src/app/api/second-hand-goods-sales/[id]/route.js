import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const salesOrder = await prisma.secondHandGoodsSales.findUnique({
      where: { salesOrderId: Number(params.id) },
      include: {
        currency: {
          select: {
            currencyId: true,
            currencyName: true,
            currencySymbol: true
          }
        },
        items: {
          where: { status: { not: "D" } },
          include: {
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!salesOrder || salesOrder.status === "D") {
      return Response.json({ error: "Sales Order not found" }, { status: 404 });
    }

    return Response.json({ success: true, salesOrder });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

