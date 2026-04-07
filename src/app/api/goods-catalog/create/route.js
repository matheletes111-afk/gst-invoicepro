import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);

    if (!organizationId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }), { status: 401 });
    }

    const body = await req.json();
    const { goodsName, goodsCode, goodsDescription, goodsPrice, unitId, status } = body;

    // Validate required fields
    if (!goodsName || !goodsCode) {
      return new Response(JSON.stringify({
        success: false,
        error: "Goods Name and Goods Code are required."
      }), { status: 400 });
    }

    if (!goodsPrice || goodsPrice <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Valid Goods Price is required."
      }), { status: 400 });
    }

    if (!unitId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Unit is required."
      }), { status: 400 });
    }

    // Check if goodsCode exists with status A or I within the same organization
    const existing = await prisma.GoodsCatalog.findFirst({
      where: {
        goodsCode: goodsCode,
        organizationId: organizationId,
        status: { in: ["A", "I"] }   // Active or Inactive
      }
    });

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "Goods code already exists with status Active/Inactive."
      }), { status: 409 }); // Conflict
    }

    // Verify unit exists
    const unit = await prisma.Unit.findUnique({
      where: { id: parseInt(unitId) }
    });

    if (!unit) {
      return new Response(JSON.stringify({
        success: false,
        error: "Unit not found."
      }), { status: 404 });
    }

    // Create new record
    const goods = await prisma.GoodsCatalog.create({
      data: {
        goodsName,
        goodsCode,
        goodsDescription,
        goodsPrice: parseFloat(goodsPrice),
        unitId: parseInt(unitId),
        organizationId: organizationId,
        status: status ?? "A" // default Active
      }
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
            action: 'CREATE',  //CREATE, UPDATE, DELETE
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

    return new Response(JSON.stringify({
      success: true,
      message: "Goods created successfully",
      goods
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

