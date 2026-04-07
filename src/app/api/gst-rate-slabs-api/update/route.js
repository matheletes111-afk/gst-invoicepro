import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();


    const { id, slabName, startRange, endRange, effectiveDate, remarks, status } = body;

    if (!id) {
      return Response.json({ error: "Slab ID is required" }, { status: 400 });
    }

    const slab = await prisma.GstSlab.update({
      where: { slabId: parseInt(id) },
      data: {
        slabName,
        startRange: parseFloat(startRange),
        endRange: parseFloat(endRange),
        effectiveDate: new Date(effectiveDate),
        remarks,
        status
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
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: slab,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, slab });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
