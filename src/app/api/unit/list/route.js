import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {


  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = searchParams.get("sortDir") || "desc";

    const search = searchParams.get("search") || "";

    let where = {
      isDeleted: 0,
    };

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Get total count
    const total = await prisma.unit.count({ where });

    // Get units with pagination
    const units = await prisma.unit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json({
      success: true,
      units,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("List units error:", error);
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


    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "Unit ID required" }, { status: 400 });
    }

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUnit || existingUnit.isDeleted === 1) {
      return Response.json({ success: false, error: "Unit not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.unit.update({
      where: { id: parseInt(id) },
      data: {
        isDeleted: 1,
        updatedAt: new Date(),
        status: 'I'
      }
    });

    return Response.json({
      success: true,
      message: "Unit deleted successfully (soft delete)"
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}