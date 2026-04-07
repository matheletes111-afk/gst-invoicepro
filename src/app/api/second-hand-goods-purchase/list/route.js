import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "purchaseOrderId";
        const sortDir = searchParams.get("sortDir") || "desc";

        const search = searchParams.get("search") || "";

        let where = {
            status: { not: "D" }, 
        };

        if (search) {
            where.OR = [
                { purchaseOrderNo: { contains: search } },
            ];
        }

        const total = await prisma.secondHandGoodsPurchase.count({ where });

        const data = await prisma.secondHandGoodsPurchase.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
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

        return Response.json({
            success: true,
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}


// ------------------------------------------------------
// SOFT DELETE API (Update status = "D")
// ------------------------------------------------------

export async function DELETE(req) {
    try {
        const body = await req.json();
        const { purchaseOrderId } = body;

        if (!purchaseOrderId) {
            return Response.json({ success: false, error: "Purchase Order ID required" }, { status: 400 });
        }

        const exists = await prisma.secondHandGoodsPurchase.findUnique({
            where: { purchaseOrderId: parseInt(purchaseOrderId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Purchase Order not found" }, { status: 404 });
        }

        // Soft-delete: update status = "D" for purchase order and all items
        await prisma.$transaction([
            prisma.secondHandGoodsPurchase.update({
                where: { purchaseOrderId: parseInt(purchaseOrderId) },
                data: { status: "D" },
            }),
            prisma.secondHandGoodsPurchaseItem.updateMany({
                where: { purchaseOrderId: parseInt(purchaseOrderId) },
                data: { status: "D" },
            })
        ]);

        return Response.json({ success: true, message: "Purchase Order deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

