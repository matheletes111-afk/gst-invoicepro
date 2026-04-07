import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "inventoryId";
        const sortDir = searchParams.get("sortDir") || "desc";

        const search = searchParams.get("search") || "";

        let where = {
            status: { not: "D" }, 
        };

        if (search) {
            where.OR = [
                { goodsName: { contains: search } },
                { goodsDescription: { contains: search } }
            ];
        }

        const total = await prisma.secondHandGoodsInventory.count({ where });

        const data = await prisma.secondHandGoodsInventory.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                unit: {
                    select: {
                        id: true,
                        name: true
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
        const { inventoryId } = body;

        if (!inventoryId) {
            return Response.json({ success: false, error: "Inventory ID required" }, { status: 400 });
        }

        const exists = await prisma.secondHandGoodsInventory.findUnique({
            where: { inventoryId: parseInt(inventoryId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Inventory item not found" }, { status: 404 });
        }

        //  Soft-delete: update status = "D"
        await prisma.secondHandGoodsInventory.update({
            where: { inventoryId: parseInt(inventoryId) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Inventory item deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

