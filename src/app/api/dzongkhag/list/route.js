import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
// ------------------------------------------------------
// LIST DZONGKHAG (Pagination + Sort + Search)
// ------------------------------------------------------

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "dzongkhagId";
    const sortDir = searchParams.get("sortDir") || "asc";

    const search = searchParams.get("search") || "";

    // Build where condition
    let where = {
      status: { in: ["A", "I"] },
      ...(search
        ? {
            OR: [
              { name: { contains: search } } // remove 'mode'
            ]
          }
        : {})
    };

    const total = await prisma.Dzongkhag.count({ where });

    const data = await prisma.Dzongkhag.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
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
// SOFT DELETE DZONGKHAG (status = "D")
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
            action: 'DELETE',
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
    const { dzongkhagId } = body;

    if (!dzongkhagId) {
      return Response.json({ success: false, error: "Dzongkhag ID required" }, { status: 400 });
    }

    const exists = await prisma.Dzongkhag.findUnique({
      where: { dzongkhagId: parseInt(dzongkhagId) },
    });

    if (!exists) {
      return Response.json({ success: false, error: "Dzongkhag not found" }, { status: 404 });
    }

    await prisma.Dzongkhag.update({
      where: { dzongkhagId: parseInt(dzongkhagId) },
      data: { status: "I" },
    });

    return Response.json({ success: true, message: "Dzongkhag Deactivated successfully" });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
