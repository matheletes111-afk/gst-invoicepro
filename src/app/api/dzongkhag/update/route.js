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
            action: 'UPDATE',
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
    const { dzongkhagId, name, code, status } = body;

    if (!dzongkhagId) {
      return Response.json({ error: "Dzongkhag ID is required" }, { status: 400 });
    }

    if (!name) {
      return Response.json({ error: "Dzongkhag name is required" }, { status: 400 });
    }

    // -----------------------------------------------
    // Check duplicate Dzongkhag name
    // Exclude its own ID
    // Only check status A or I
    // -----------------------------------------------
    const duplicate = await prisma.Dzongkhag.findFirst({
      where: {
        name: name,
        status: { in: ["A", "I"] },
        dzongkhagId: { not: Number(dzongkhagId) }
      }
    });

    if (duplicate) {
      return Response.json({
        error: "Dzongkhag name already exists."
      }, { status: 400 });
    }

    // -----------------------------------------------
    // Update Dzongkhag
    // -----------------------------------------------
    const dzongkhag = await prisma.Dzongkhag.update({
      where: { dzongkhagId: Number(dzongkhagId) },
      data: {
        name,
        code: code || null,
        status
      }
    });

    return Response.json({ success: true, dzongkhag });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
