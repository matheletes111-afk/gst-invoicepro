import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// =========================
// GET – List Currencies
// =========================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "currencyId";
    const sortDir = searchParams.get("sortDir") || "asc";
    const search = searchParams.get("search") || "";

    let where = { status: { not: "D" } };

    if (search) {
      where.OR = [
        { currencyName: { contains: search } },
        { currencySymbol: { contains: search } }
      ];
    }

    const total = await prisma.currency.count({ where });

    const currencies = await prisma.currency.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir }
    });

    return Response.json({
      success: true,
      rates: currencies,
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
    const { currencyId } = await req.json();

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
            payload: { currencyid: currencyId },
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    if (!currencyId) {
      return Response.json({ success: false, error: "Currency ID required" }, { status: 400 });
    }

    const exists = await prisma.currency.findUnique({
      where: { currencyId: parseInt(currencyId) }
    });

    if (!exists) {
      return Response.json({ success: false, error: "Currency not found" }, { status: 404 });
    }

    await prisma.currency.update({
      where: { currencyId: parseInt(currencyId) },
      data: { status: "D" }
    });

    return Response.json({ success: true, message: "Currency deleted successfully" });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
