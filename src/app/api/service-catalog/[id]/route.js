import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const slab = await prisma.ServiceCatalog.findUnique({
      where: { service_id: Number(params.id) }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!slab || slab.status === "D") {
      return Response.json({ error: "Service not found" }, { status: 404 });
    }

    return Response.json({ success: true, slab });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
