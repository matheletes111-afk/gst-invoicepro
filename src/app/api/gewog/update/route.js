import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
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
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
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
    const { gewogId, dzongkhagId, name, code, status } = body;

    if (!gewogId) {
      return Response.json({ success: false, error: "Gewog ID is required" }, { status: 400 });
    }

    if (!dzongkhagId) {
      return Response.json({ success: false, error: "Dzongkhag ID is required" }, { status: 400 });
    }

    if (!name) {
      return Response.json({ success: false, error: "Gewog name is required" }, { status: 400 });
    }

    // Check duplicate Gewog name within the same Dzongkhag
    const duplicate = await prisma.gewog.findFirst({
      where: {
        dzongkhagId: Number(dzongkhagId),
        name: name,
        status: { in: ["A", "I"] },
        NOT: { gewogId: Number(gewogId) }
      }
    });

    if (duplicate) {
      return Response.json({
        success: false,
        error: "Gewog name already exists in this Dzongkhag."
      }, { status: 400 });
    }

    // Update Gewog
    const gewog = await prisma.gewog.update({
      where: { gewogId: Number(gewogId) },
      data: {
        dzongkhagId: Number(dzongkhagId),
        name,
        code: code || null,
        status
      }
    });

    return Response.json({ success: true, gewog });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
