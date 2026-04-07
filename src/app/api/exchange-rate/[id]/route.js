import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const exchangeRate = await prisma.ExchangeRateMaster.findUnique({
      where: { exchangeId: Number(params.id) },
      include: {
        currency: {
          select: {
            currencyId: true,
            currencyName: true,
            currencySymbol: true
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!exchangeRate || exchangeRate.status === "D") {
      return Response.json({ error: "Exchange rate not found" }, { status: 404 });
    }

    return Response.json({ success: true, exchangeRate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

