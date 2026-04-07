import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
   


    const { unitId, name, description, status } = body;

    if (!unitId) {
      return Response.json({ error: "Unit ID is required" }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return Response.json({ error: "Unit name is required" }, { status: 400 });
    }

    // Validate status
    if (status && !['A', 'I'].includes(status)) {
      return Response.json({ error: "Status must be 'A' (Active) or 'I' (Inactive)" }, { status: 400 });
    }

    // Check if unit exists and is not deleted
    const existingUnit = await prisma.unit.findUnique({
      where: {
        id: parseInt(unitId),
        isDeleted: 0
      }
    });

    if (!existingUnit) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    // Check if another unit with same name exists
    const duplicateUnit = await prisma.unit.findFirst({
      where: {
        id: { not: parseInt(unitId) },
        name: name.trim(),
        isDeleted: 0
      }
    });

    if (duplicateUnit) {
      return Response.json({ error: "Another unit with this name already exists" }, { status: 409 });
    }

    // Update unit
    const updatedUnit = await prisma.unit.update({
      where: { id: parseInt(unitId) },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || 'A',
        updatedAt: new Date()
      }
    });

     // Log activity
    try {
      const user = await getUserFromRequest(req);

      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: updatedUnit,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({
      success: true,
      message: "Unit updated successfully",
      unit: updatedUnit
    });
  } catch (error) {
    console.error("Update unit error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}