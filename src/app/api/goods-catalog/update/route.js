import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";


export async function POST(req) {
  try {
    const body = await req.json();


    const { id, goodsName, goodsCode, goodsDescription, goodsPrice, unitId, status } = body;

    if (!id) {
      return Response.json({ error: "Goods ID is required" }, { status: 400 });
    }

    // Check duplicates (goodsCode)
    // Exclude its own ID
    // Only check status A or I
    const duplicate = await prisma.GoodsCatalog.findFirst({
      where: {
        goodsCode: goodsCode,
        status: { in: ["A", "I"] },
        goodsId: { not: Number(id) }
      }
    });

    if (duplicate) {
      return Response.json({
        error: "Goods Code already exists."
      }, { status: 400 });
    }

    // Verify unit exists if provided
    if (unitId) {
      const unit = await prisma.Unit.findUnique({
        where: { id: parseInt(unitId) }
      });

      if (!unit) {
        return Response.json({
          error: "Unit not found."
        }, { status: 404 });
      }
    }

    // Update Goods Catalog
    const updateData = {
      goodsName,
      goodsCode,
      goodsDescription,
      status
    };

    if (goodsPrice) {
      updateData.goodsPrice = parseFloat(goodsPrice);
    }

    if (unitId) {
      updateData.unitId = parseInt(unitId);
    }

    const goods = await prisma.GoodsCatalog.update({
      where: { goodsId: Number(id) },
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
            payload: goods,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, goods });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

