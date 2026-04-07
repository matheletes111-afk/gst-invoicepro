import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
export async function POST(req) {
  try {
    const body = await req.json();

    const { id, currencyName, currencySymbol, status } = body;

    if (!id) {
      return Response.json({ success: false, error: "Currency ID is required" }, { status: 400 });
    }

    const updated = await prisma.currency.update({
      where: { currencyId: Number(id) },
      data: {
        currencyName,
        currencySymbol,
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
            payload: updated,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, currency: updated });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
