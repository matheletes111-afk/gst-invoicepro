import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
  
    const { slabId, gstRate, effectiveDate, remarks, status } = body;

    const rate = await prisma.gstRate.create({
      data: {
        slabId: slabId ? parseInt(slabId) : null,
        gstRate: parseFloat(gstRate),
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
            action: 'CREATE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: rate,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return new Response(JSON.stringify({ success: true, rate }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
