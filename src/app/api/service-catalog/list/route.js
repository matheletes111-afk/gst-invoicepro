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

        const sortBy = searchParams.get("sortBy") || "service_id";
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
                        { service_name: { contains: search } },
                        { service_code: { contains: search } },
                        { service_description: { contains: search } }
                    ]
                }
            ];
            delete where.OR;
        }

        const total = await prisma.ServiceCatalog.count({ where });

        const data = await prisma.ServiceCatalog.findMany({
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
        const { service_id } = body;

        if (!service_id) {
            return Response.json({ success: false, error: "Service ID required" }, { status: 400 });
        }

        const exists = await prisma.ServiceCatalog.findUnique({
            where: { service_id: parseInt(service_id) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Service not found" }, { status: 404 });
        }

        //  Soft-delete: update status = "D"
        await prisma.ServiceCatalog.update({
            where: { service_id: parseInt(service_id) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Service deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
