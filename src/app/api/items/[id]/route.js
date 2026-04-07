import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const item = await prisma.item.findUnique({
            where: { itemId: Number(params.id) },
            include: {
                unitObject: true,
            },
        });

        if (!item)
            return Response.json({ error: "Item not found" }, { status: 404 });

        return Response.json({ success: true, item });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
