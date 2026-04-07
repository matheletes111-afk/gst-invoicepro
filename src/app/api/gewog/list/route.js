import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// ------------------------------------------------------
// LIST GEWOG (Pagination + Sort + Search)
// ------------------------------------------------------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "gewogId";
    const sortDir = searchParams.get("sortDir") || "asc";

    const search = searchParams.get("search") || "";

    // Build where condition
    let where = {
      status: { in: ["A", "I"] },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } }
            ]
          }
        : {})
    };

    const total = await prisma.Gewog.count({ where });

    const data = await prisma.Gewog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: { dzongkhag: true } // include Dzongkhag name
    });

    return Response.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ------------------------------------------------------
// SOFT DELETE GEWOG (status = "D")
// ------------------------------------------------------
export async function DELETE(req) {
  try {
    const body = await req.json();

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
            payload: body,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    const { gewogId } = body;

    if (!gewogId) {
      return Response.json({ success: false, error: "Gewog ID required" }, { status: 400 });
    }

    const exists = await prisma.Gewog.findUnique({
      where: { gewogId: parseInt(gewogId) },
    });

    if (!exists) {
      return Response.json({ success: false, error: "Gewog not found" }, { status: 404 });
    }

    await prisma.Gewog.update({
      where: { gewogId: parseInt(gewogId) },
      data: { status: "I" },
    });

    return Response.json({ success: true, message: "Gewog deactivated successfully" });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
