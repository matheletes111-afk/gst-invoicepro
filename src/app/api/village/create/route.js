import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// ------------------------------------------------------
// CREATE NEW VILLAGE
// ------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json();

    const { gewogId, name, code, status } = body;

    if (!gewogId) {
      return Response.json(
        { success: false, error: "Gewog is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        { success: false, error: "Village name is required" },
        { status: 400 }
      );
    }

    // Validate Gewog exists & active
    const gewog = await prisma.Gewog.findFirst({
      where: {
        gewogId: parseInt(gewogId),
        status: "A",
      },
    });

    if (!gewog) {
      return Response.json(
        { success: false, error: "Selected Gewog not found or inactive" },
        { status: 400 }
      );
    }

    // Duplicate check
    const existingVillages = await prisma.Village.findMany({
      where: {
        gewogId: parseInt(gewogId),
        status: { in: ["A", "I"] },
      },
    });

    const duplicateVillage = existingVillages.find(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicateVillage) {
      return Response.json(
        { success: false, error: "Village already exists in this Gewog" },
        { status: 400 }
      );
    }

    // Create Village
    const village = await prisma.Village.create({
      data: {
        gewogId: parseInt(gewogId),
        name,
        code: code || null,
        status: status || "A",
      },
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
            payload: village,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, village });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------
// GET GEWOGS FOR DROPDOWN
// ------------------------------------------------------
export async function GET() {
  try {
    const gewogs = await prisma.Gewog.findMany({
      where: {
        status: {
          in: ["A", "I"]
        }
      },
      orderBy: { name: "asc" },
      select: { gewogId: true, name: true },
    });

    return Response.json({ success: true, gewogs });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
