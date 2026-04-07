import prisma from "@/lib/prisma";
import { getUserFromRequest, getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req) {
    try {
        const organizationId = await getOrganizationIdFromRequest(req);
        if (!organizationId) {
            return Response.json(
                { success: false, error: "Unauthorized: Organization ID not found in token" },
                { status: 401 }
            );
        }

        const [goodsRows, serviceRows] = await Promise.all([
            prisma.GoodsCatalog.findMany({
                where: { organizationId, status: { not: "D" } },
                select: { goodsId: true },
            }),
            prisma.ServiceCatalog.findMany({
                where: { organizationId, status: { not: "D" } },
                select: { service_id: true },
            }),
        ]);
        const goodsIds = goodsRows.map((g) => g.goodsId);
        const serviceIds = serviceRows.map((s) => s.service_id);

        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "mappingId";
        const sortDir = searchParams.get("sortDir") || "asc";

        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "";

        let where = { status: { not: "D" } };

        if (type === "GOODS") {
            where.type = "GOODS";
            where.serviceGoodsId = { in: goodsIds };
        } else if (type === "SERVICE") {
            where.type = "SERVICE";
            where.serviceGoodsId = { in: serviceIds };
        } else {
            where.AND = [
                {
                    OR: [
                        { type: "GOODS", serviceGoodsId: { in: goodsIds } },
                        { type: "SERVICE", serviceGoodsId: { in: serviceIds } },
                    ],
                },
            ];
        }

        if (search) {
            const remarkFilter = { remarks: { contains: search } };
            if (where.AND) {
                where.AND.push(remarkFilter);
            } else {
                where = { AND: [where, remarkFilter] };
            }
        }

        const total = await prisma.MapGstRates.count({ where });

        const data = await prisma.MapGstRates.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                slab: {
                    select: {
                        slabId: true,
                        slabName: true
                    }
                },
                rate: {
                    select: {
                        rateId: true,
                        gstRate: true
                    }
                }
            }
        });

        // Fetch goods/service names based on type
        const enrichedData = await Promise.all(data.map(async (item) => {
            let serviceGoodsName = null;
            if (item.type === "GOODS") {
                const goods = await prisma.GoodsCatalog.findUnique({
                    where: { goodsId: item.serviceGoodsId },
                    select: { goodsName: true, goodsCode: true }
                });
                serviceGoodsName = goods ? `${goods.goodsName} (${goods.goodsCode})` : null;
            } else if (item.type === "SERVICE") {
                const service = await prisma.ServiceCatalog.findUnique({
                    where: { service_id: item.serviceGoodsId },
                    select: { service_name: true, service_code: true }
                });
                serviceGoodsName = service ? `${service.service_name} (${service.service_code})` : null;
            }
            return { ...item, serviceGoodsName };
        }));

        return Response.json({
            success: true,
            data: enrichedData,
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
        const { mappingId } = body;

        if (!mappingId) {
            return Response.json({ success: false, error: "Mapping ID required" }, { status: 400 });
        }

        const organizationId = await getOrganizationIdFromRequest(req);
        if (!organizationId) {
            return Response.json(
                { success: false, error: "Unauthorized: Organization ID not found in token" },
                { status: 401 }
            );
        }

        const exists = await prisma.MapGstRates.findUnique({
            where: { mappingId: parseInt(mappingId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Mapping not found" }, { status: 404 });
        }

        if (exists.type === "GOODS") {
            const goods = await prisma.GoodsCatalog.findUnique({
                where: { goodsId: exists.serviceGoodsId },
                select: { organizationId: true },
            });
            if (!goods || goods.organizationId !== organizationId) {
                return Response.json({ success: false, error: "Mapping not found" }, { status: 404 });
            }
        } else if (exists.type === "SERVICE") {
            const service = await prisma.ServiceCatalog.findUnique({
                where: { service_id: exists.serviceGoodsId },
                select: { organizationId: true },
            });
            if (!service || service.organizationId !== organizationId) {
                return Response.json({ success: false, error: "Mapping not found" }, { status: 404 });
            }
        }

        //  Soft-delete: update status = "D"
        await prisma.MapGstRates.update({
            where: { mappingId: parseInt(mappingId) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Mapping deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

