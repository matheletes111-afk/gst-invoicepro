import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";




export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const sortBy = searchParams.get("sortBy") || "slabId";
        const sortDir = searchParams.get("sortDir") || "asc";

        const search = searchParams.get("search") || "";

        let where = {
              isDeleted: 0, 
            };
        const conditions = [];

        if (search) {
            // 1. String fields
            conditions.push(
                { slabName: { contains: search } },
                { remarks: { contains: search } }
            );

            // 2. Numeric fields
            const numericValue = parseFloat(search);
            if (!isNaN(numericValue)) {
                conditions.push(
                    { startRange: { equals: numericValue } },
                    { endRange: { equals: numericValue } }
                );
            }

            // 3. Date field - Use raw SQL for date search
            // First, check if the search string looks like a date
            const isDateSearch = search.includes('/') ||
                search.includes('-') ||
                search.match(/^\d{4}$/) || // Year only
                search.match(/^\d{6}$/);   // MMyyyy

            if (isDateSearch) {
                try {
                    // MySQL/MariaDB raw query for date search
                    const dateResults = await prisma.$queryRaw`
                        SELECT slabId
                        FROM GstSlab
                        WHERE 
                            DATE_FORMAT(effectiveDate, '%d/%m/%Y') LIKE ${`%${search}%`}
                            OR DATE_FORMAT(effectiveDate, '%Y-%m-%d') LIKE ${`%${search}%`}
                            OR DATE_FORMAT(effectiveDate, '%m/%d/%Y') LIKE ${`%${search}%`}
                            OR DATE_FORMAT(effectiveDate, '%Y') = ${search}
                            OR DATE_FORMAT(effectiveDate, '%m/%Y') LIKE ${`%${search}%`}
                    `;

                    // If we found matching dates, add them to conditions
                    if (dateResults.length > 0) {
                        const slabIds = dateResults.map(item => item.slabId);
                        conditions.push({ slabId: { in: slabIds } });
                    }
                } catch (error) {
                    console.log("Date search failed:", error);
                    // Continue without date search
                }
            }

            // Remove any undefined conditions
            const validConditions = conditions.filter(condition => {
                const value = Object.values(condition)[0];
                return value !== undefined;
            });

            if (validConditions.length > 0) {
                where = { OR: validConditions };
            }
        }

        const total = await prisma.gstSlab.count({ where });

        const slabs = await prisma.gstSlab.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortDir },
        });

        return Response.json({
            success: true,
            slabs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}







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
    const { slabId } = body;

    if (!slabId) {
      return Response.json({ success: false, error: "Slab ID required" }, { status: 400 });
    }

    const existingSlab = await prisma.GstSlab.findUnique({
      where: { slabId: parseInt(slabId) },
    });

    if (!existingSlab || existingSlab.isDeleted === 1) {
      return Response.json({ success: false, error: "GST Slab not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.GstSlab.update({
      where: { slabId: parseInt(slabId) },
      data: {
        isDeleted: 1,
        status: "I"
      }
    });

    return Response.json({ success: true, message: "GST Slab deleted successfully (soft delete)" });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}