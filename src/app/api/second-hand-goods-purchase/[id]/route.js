import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const purchaseOrder = await prisma.secondHandGoodsPurchase.findUnique({
      where: { purchaseOrderId: Number(params.id) },
      include: {
        supplier: {
          select: {
            supplierId: true,
            supplierName: true
          }
        },
        dealer: {
          select: {
            dealerId: true,
            dealerName: true
          }
        },
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
    if (!purchaseOrder || purchaseOrder.status === "D") {
      return Response.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    return Response.json({ success: true, purchaseOrder });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

