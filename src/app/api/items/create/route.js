import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { itemType, name, code, desc, price, unit, status } = body;

        const item = await prisma.item.create({
            data: { itemType, name, code, desc, price, unit,status }
        });

        return Response.json({ success: true, item });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
