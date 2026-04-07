import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const slab = await prisma.GstSlab.findUnique({
            where: { slabId: Number(params.id) }
        });

        if (!slab) {
            return Response.json({ error: "GST Slab not found" }, { status: 404 });
        }

        return Response.json({ success: true, slab });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
