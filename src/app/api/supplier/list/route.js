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

        const sortBy = searchParams.get("sortBy") || "supplierId";
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
                        { supplierName: { contains: search } },
                        { businessLicenseNo: { contains: search } },
                        { taxpayerRegNo: { contains: search } },
                        { contactName: { contains: search } },
                        { contactEmail: { contains: search } },
                        { contactPhone: { contains: search } }
                    ]
                }
            ];
            delete where.OR;
        }

        const total = await prisma.supplierMaster.count({ where });

        const data = await prisma.supplierMaster.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                dzongkhag: {
                    select: {
                        dzongkhagId: true,
                        name: true
                    }
                },
                gewog: {
                    select: {
                        gewogId: true,
                        name: true
                    }
                },
                village: {
                    select: {
                        villageId: true,
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
        const { supplierId } = body;

        if (!supplierId) {
            return Response.json({ success: false, error: "Supplier ID required" }, { status: 400 });
        }

        const exists = await prisma.supplierMaster.findUnique({
            where: { supplierId: parseInt(supplierId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Supplier not found" }, { status: 404 });
        }

        //  Soft-delete: update status = "D"
        await prisma.supplierMaster.update({
            where: { supplierId: parseInt(supplierId) },
            data: { status: "D" },
        });

        return Response.json({ success: true, message: "Supplier deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

