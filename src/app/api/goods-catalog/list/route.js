import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
    try {
        // Get organizationId from JWT token
        const organizationId = await getOrganizationIdFromRequest(req);

        if (!organizationId) {
            return Response.json({
                success: false,
                error: "Unauthorized: Organization ID not found in token"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "goodsId";
        const sortDir = searchParams.get("sortDir") || "asc";

        const search = searchParams.get("search") || "";

        let where = {
            status: { not: "D" },
            organizationId: organizationId // Filter by user's organization
        };

        if (search) {
            where.AND = [
                { organizationId: organizationId },
                {
                    OR: [
                        { goodsName: { contains: search } },
                        { goodsCode: { contains: search } },
                        { goodsDescription: { contains: search } }
                    ]
                }
            ];
            delete where.OR;
        }

        const total = await prisma.GoodsCatalog.count({ where });

        const data = await prisma.GoodsCatalog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                unit: {
                    select: {
                        id: true,
                        name: true
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
        const { goodsId } = body;

        if (!goodsId) {
            return Response.json({ success: false, error: "Goods ID required" }, { status: 400 });
        }

        const exists = await prisma.GoodsCatalog.findUnique({
            where: { goodsId: parseInt(goodsId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Goods not found" }, { status: 404 });
        }

        //  Soft-delete: update status = "D"
        await prisma.GoodsCatalog.update({
            where: { goodsId: parseInt(goodsId) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Goods deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

