import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "salesOrderId";
        const sortDir = searchParams.get("sortDir") || "desc";

        const search = searchParams.get("search") || "";

        let where = {
            status: { not: "D" }, 
        };

        if (search) {
            where.OR = [
                { invoiceNo: { contains: search } },
                { customer: { contains: search } },
                { customerTPN: { contains: search } }
            ];
        }

        const total = await prisma.secondHandGoodsSales.count({ where });

        const data = await prisma.secondHandGoodsSales.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
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
        const { salesOrderId } = body;

        if (!salesOrderId) {
            return Response.json({ success: false, error: "Sales Order ID required" }, { status: 400 });
        }

        const exists = await prisma.secondHandGoodsSales.findUnique({
            where: { salesOrderId: parseInt(salesOrderId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Sales Order not found" }, { status: 404 });
        }

        // Soft-delete: update status = "D" for sales order and all items
        await prisma.$transaction([
            prisma.secondHandGoodsSales.update({
                where: { salesOrderId: parseInt(salesOrderId) },
                data: { status: "D" },
            }),
            prisma.secondHandGoodsSalesItem.updateMany({
                where: { salesOrderId: parseInt(salesOrderId) },
                data: { status: "D" },
            })
        ]);

        return Response.json({ success: true, message: "Sales Order deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

