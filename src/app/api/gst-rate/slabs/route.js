import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const slabs = await prisma.gstSlab.findMany({
      where: { status: "A" },
      orderBy: { slabName: "asc" }
    });

    return new Response(JSON.stringify({ success: true, slabs }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
