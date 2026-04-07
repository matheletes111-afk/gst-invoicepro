import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const supplier = await prisma.supplierMaster.findUnique({
      where: { supplierId: Number(params.id) },
      include: {
        dzongkhag: {
          select: {
            dzongkhagId: true,
            name: true
          }
        },
        gewog: {
          select: {
            gewogId: true,
            name: true
          }
        },
        village: {
          select: {
            villageId: true,
            name: true
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!supplier || supplier.status === "D") {
      return Response.json({ error: "Supplier not found" }, { status: 404 });
    }

    return Response.json({ success: true, supplier });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

