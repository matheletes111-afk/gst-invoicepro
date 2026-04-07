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
    const { villageId, gewogId, name, code, status } = body;

    if (!villageId) 
      return Response.json({ success: false, error: "Village ID is required" });

    if (!gewogId) 
      return Response.json({ success: false, error: "Gewog ID is required" });

    if (!name) 
      return Response.json({ success: false, error: "Village name is required" });

    // Duplicate Check → village name must be unique inside same Gewog
    const duplicate = await prisma.village.findFirst({
      where: {
        gewogId: Number(gewogId),
        name,
        status: { in: ["A", "I"] },
        NOT: { villageId: Number(villageId) }
      }
    });

    if (duplicate) {
      return Response.json({
        success: false,
        error: "Village name already exists in this Gewog."
      });
    }

    const village = await prisma.village.update({
      where: { villageId: Number(villageId) },
      data: {
        gewogId: Number(gewogId),
        name,
        code: code || null,
        status
      }
    });

    return Response.json({ success: true, village });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
