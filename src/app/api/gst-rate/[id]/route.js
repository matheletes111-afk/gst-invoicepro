import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const rate = await prisma.gstRate.findUnique({
      where: { rateId: Number(params.id) },
      include: { slab: true } // include slab info
    });

    if (!rate) {
      return Response.json({ success: false, error: "GST Rate not found" }, { status: 404 });
    }

    return Response.json({ success: true, rate });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
