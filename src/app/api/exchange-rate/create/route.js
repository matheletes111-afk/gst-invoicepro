import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    const { currencyId, exchangeRate, date, status } = body;

    // Validate required fields
    if (!currencyId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Currency is required." 
      }), { status: 400 });
    }

    if (!exchangeRate || exchangeRate <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Valid Exchange Rate is required." 
      }), { status: 400 });
    }

    if (!date) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Date is required." 
      }), { status: 400 });
    }

    // Verify currency exists
    const currency = await prisma.Currency.findUnique({
      where: { currencyId: parseInt(currencyId) }
    });

    if (!currency) {
      return new Response(JSON.stringify({
        success: false,
        error: "Currency not found."
      }), { status: 404 });
    }

    // Create new record
    const exchangeRateRecord = await prisma.ExchangeRateMaster.create({
      data: {
        currencyId: parseInt(currencyId),
        exchangeRate: parseFloat(exchangeRate),
        date: new Date(date),
        status: status ?? "A" // default Active
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
            payload: exchangeRateRecord,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Exchange rate created successfully",
      exchangeRate: exchangeRateRecord
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

