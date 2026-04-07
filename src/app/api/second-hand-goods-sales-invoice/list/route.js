import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

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

        const sortBy = searchParams.get("sortBy") || "invoiceId";
        const sortDir = searchParams.get("sortDir") || "desc";

        const search = searchParams.get("search") || "";

        // Filter by user's organization
        let where = {
            status: { not: "D" },
            organizationId: organizationId // Filter by user's organization
        };

        if (search) {
            where.AND = [
                { organizationId: organizationId },
                {
                    OR: [
                        { invoiceNo: { contains: search } },
                        { customerName: { contains: search } },
                        { customerTPN: { contains: search } }
                    ]
                }
            ];
        }

        const total = await prisma.secondHandGoodsSalesInvoice.count({ where });

        const data = await prisma.secondHandGoodsSalesInvoice.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
            include: {
                organization: {
                    include: {
                        businessDetails: true
                    }
                },
                party: {
                    include: {
                        businessParty: true,
                        individualParty: true
                    }
                },
                currency: {
                    select: {
                        currencyId: true,
                        currencyName: true,
                        currencySymbol: true
                    }
                },
                items: {
                    where: { status: { not: "D" } },
                    include: {
                        unit: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
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
        const { invoiceId } = body;

        if (!invoiceId) {
            return Response.json({ success: false, error: "Invoice ID required" }, { status: 400 });
        }

        const exists = await prisma.secondHandGoodsSalesInvoice.findUnique({
            where: { invoiceId: parseInt(invoiceId) },
        });

        if (!exists) {
            return Response.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        // Get organizationId from JWT token and verify access
        const organizationId = await getOrganizationIdFromRequest(req);
        
        if (!organizationId) {
            return Response.json({
                success: false,
                error: "Unauthorized: Organization ID not found in token"
            }, { status: 401 });
        }

        // Verify that the invoice belongs to user's organization
        if (exists.organizationId !== organizationId) {
            return Response.json({
                success: false,
                error: "Unauthorized: You don't have access to this invoice"
            }, { status: 403 });
        }

        // Soft-delete: update status = "D" for invoice and all items
        await prisma.$transaction([
            prisma.secondHandGoodsSalesInvoice.update({
                where: { invoiceId: parseInt(invoiceId) },
                data: { status: "D" },
            }),
            prisma.secondHandGoodsSalesInvoiceItem.updateMany({
                where: { invoiceId: parseInt(invoiceId) },
                data: { status: "D" },
            })
        ]);

        return Response.json({ success: true, message: "Invoice deleted successfully" });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

