import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";




export async function POST(req) {
  // Log activity
  try {
    await logApiActivity(req);
  } catch (logError) {
    console.error('Activity logging failed:', logError);
  }

  try {
    const body = await req.json();

    const { name, description, status } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return new Response(
        JSON.stringify({ error: "Unit name is required" }),
        { status: 400 }
      );
    }

    // Validate status
    if (status && !['A', 'I'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Status must be 'A' (Active) or 'I' (Inactive)" }),
        { status: 400 }
      );
    }

    // Check if unit already exists (not deleted)
    const existingUnit = await prisma.unit.findFirst({
      where: {
        name: name.trim(),
        isDeleted: 0
      }
    });

    if (existingUnit) {
      return new Response(
        JSON.stringify({ error: "Unit with this name already exists" }),
        { status: 409 }
      );
    }

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || 'A'
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

        const { default: prisma } = await import('@/lib/prisma');

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: unit,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Unit created successfully",
        unit
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create unit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}