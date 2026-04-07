import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const dealer = await prisma.dealerMaster.findUnique({
      where: { dealerId: Number(params.id) },
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
    if (!dealer || dealer.status === "D") {
      return Response.json({ error: "Dealer not found" }, { status: 404 });
    }

    return Response.json({ success: true, dealer });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

