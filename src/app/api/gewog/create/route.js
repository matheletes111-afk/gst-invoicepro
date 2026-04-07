import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// ------------------------------------------------------
// CREATE NEW GEWOG
// ------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json();

    const { dzongkhagId, name, code, status } = body;

    if (!dzongkhagId) {
      return Response.json(
        { success: false, error: "Dzongkhag is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        { success: false, error: "Gewog Name is required" },
        { status: 400 }
      );
    }

    // -------------------------------
    // CHECK IF DZONGKHAG EXISTS AND IS ACTIVE
    // -------------------------------
    const dzongkhag = await prisma.Dzongkhag.findFirst({
      where: {
        dzongkhagId: parseInt(dzongkhagId),
        status: "A",
      },
    });

    if (!dzongkhag) {
      return Response.json(
        { success: false, error: "Selected Dzongkhag not found or inactive" },
        { status: 400 }
      );
    }

    // -------------------------------
    // DUPLICATE CHECK (case-insensitive)
    // -------------------------------
    const existingGewogs = await prisma.Gewog.findMany({
      where: {
        dzongkhagId: parseInt(dzongkhagId),
        status: { in: ["A", "I"] },
      },
    });

    const duplicateGewog = existingGewogs.find(
      (g) => g.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicateGewog) {
      return Response.json(
        { success: false, error: "Gewog with this name already exists in this Dzongkhag" },
        { status: 400 }
      );
    }

    // -------------------------------
    // CREATE NEW GEWOG
    // -------------------------------
    const gewog = await prisma.Gewog.create({
      data: {
        dzongkhagId: parseInt(dzongkhagId),
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
            payload: gewog,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, gewog });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ------------------------------------------------------
// GET DZONGKHAGS (for dropdown)
// ------------------------------------------------------
export async function GET() {
  try {
    const dzongkhags = await prisma.Dzongkhag.findMany({
      where: { status: "A" },
      orderBy: { name: "asc" },
      select: { dzongkhagId: true, name: true },
    });

    return Response.json({ success: true, dzongkhags });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
