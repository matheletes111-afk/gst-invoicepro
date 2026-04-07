import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
   
    const { id, type, serviceGoodsId, slabId, gstStatus, rateId, minimumValue, remarks, status } = body;

    if (!id) {
      return Response.json({ error: "Mapping ID is required" }, { status: 400 });
    }

    // Verify service/goods exists if provided
    if (serviceGoodsId) {
      if (type === "GOODS") {
        const goods = await prisma.GoodsCatalog.findUnique({
          where: { goodsId: parseInt(serviceGoodsId) }
        });
        if (!goods) {
          return Response.json({
            error: "Goods not found."
          }, { status: 404 });
        }
      } else if (type === "SERVICE") {
        const service = await prisma.ServiceCatalog.findUnique({
          where: { service_id: parseInt(serviceGoodsId) }
        });
        if (!service) {
          return Response.json({
            error: "Service not found."
          }, { status: 404 });
        }
      }
    }

    // Verify slab exists if provided
    if (slabId) {
      const slab = await prisma.GstSlab.findUnique({
        where: { slabId: parseInt(slabId) }
      });
      if (!slab) {
        return Response.json({
          error: "GST Slab not found."
        }, { status: 404 });
      }
    }

    // Verify rate exists if provided
    if (rateId) {
      const rate = await prisma.GstRate.findUnique({
        where: { rateId: parseInt(rateId) }
      });
      if (!rate) {
        return Response.json({
          error: "GST Rate not found."
        }, { status: 404 });
      }
    }

    // Update Mapping
    const updateData = {};
    if (type) updateData.type = type;
    if (serviceGoodsId) updateData.serviceGoodsId = parseInt(serviceGoodsId);
    if (slabId !== undefined) updateData.slabId = slabId ? parseInt(slabId) : null;
    if (gstStatus) updateData.gstStatus = gstStatus;
    if (rateId !== undefined) updateData.rateId = rateId ? parseInt(rateId) : null;
    if (minimumValue !== undefined) updateData.minimumValue = minimumValue ? parseFloat(minimumValue) : null;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (status) updateData.status = status;

    const mapping = await prisma.MapGstRates.update({
      where: { mappingId: Number(id) },
      data: updateData
    });

       // Log activity
    try {
      const user = await getUserFromRequest(req);

      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        const { default: prisma } = await import('@/lib/prisma');

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: mapping,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, mapping });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

