import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
// =========================
// GET – List GST Rates
// =========================


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "rateId";
    const sortDir = searchParams.get("sortDir") || "asc";
    const search = searchParams.get("search") || "";

    let where = {
      status: { not: "D" }
    };

    if (search) {
      const gstRateNum = parseFloat(search);
      where.OR = [
        { remarks: { contains: search } }, // removed mode
        ...(isNaN(gstRateNum) ? [] : [{ gstRate: gstRateNum }]),
        { slab: { slabName: { contains: search } } } // removed mode
      ];
    }

    const total = await prisma.gstRate.count({ where });

    const rates = await prisma.gstRate.findMany({
      where,
      skip,
      take: limit,
      orderBy:
        sortBy === "slabName"
          ? { slab: { slabName: sortDir } }
          : { [sortBy]: sortDir },
      include: { slab: true }
    });

    return Response.json({
      success: true,
      rates,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}


// =========================
// DELETE – Soft Delete
// =========================
export async function DELETE(req) {
  try {
    const { rateId } = await req.json();

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
            action: 'DELETE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: { rateId: rateId },
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    if (!rateId) {
      return Response.json(
        { success: false, error: "Rate ID required" },
        { status: 400 }
      );
    }

    const exists = await prisma.gstRate.findUnique({
      where: { rateId: parseInt(rateId) }
    });

    if (!exists) {
      return Response.json(
        { success: false, error: "GST Rate not found" },
        { status: 404 }
      );
    }

    await prisma.gstRate.update({
      where: { rateId: parseInt(rateId) },
      data: { status: "D" }
    });

    return Response.json({
      success: true,
      message: "GST Rate deleted successfully"
    });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
