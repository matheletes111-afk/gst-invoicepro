import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    const { id, currencyId, exchangeRate, date, status } = body;

    if (!id) {
      return Response.json({ error: "Exchange ID is required" }, { status: 400 });
    }

    // Verify currency exists if provided
    if (currencyId) {
      const currency = await prisma.Currency.findUnique({
        where: { currencyId: parseInt(currencyId) }
      });

      if (!currency) {
        return Response.json({
          error: "Currency not found."
        }, { status: 404 });
      }
    }

    // Update Exchange Rate Master
    const updateData = {};
    if (currencyId) updateData.currencyId = parseInt(currencyId);
    if (exchangeRate) updateData.exchangeRate = parseFloat(exchangeRate);
    if (date) updateData.date = new Date(date);
    if (status) updateData.status = status;

    const exchangeRateRecord = await prisma.ExchangeRateMaster.update({
      where: { exchangeId: Number(id) },
      data: updateData
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
            payload: exchangeRateRecord,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, exchangeRate: exchangeRateRecord });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

