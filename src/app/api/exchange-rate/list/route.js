import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "exchangeId";
        const sortDir = searchParams.get("sortDir") || "asc";

        const search = searchParams.get("search") || "";

        let where = {
            status: { not: "D" }, 
        };

        if (search) {
            where.OR = [
                { currency: { currencyName: { contains: search } } },
                { currency: { currencySymbol: { contains: search } } }
            ];
        }

        const total = await prisma.ExchangeRateMaster.count({ where });

        const data = await prisma.ExchangeRateMaster.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                currency: {
                    select: {
                        currencyId: true,
                        currencyName: true,
                        currencySymbol: true
                    }
                }
            }
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
// SOFT DELETE API (Update status = "D")
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
        const { exchangeId } = body;

        if (!exchangeId) {
            return Response.json({ success: false, error: "Exchange ID required" }, { status: 400 });
        }

        const exists = await prisma.ExchangeRateMaster.findUnique({
            where: { exchangeId: parseInt(exchangeId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Exchange rate not found" }, { status: 404 });
        }

        //  Soft-delete: update status = "D"
        await prisma.ExchangeRateMaster.update({
            where: { exchangeId: parseInt(exchangeId) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Exchange rate deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

