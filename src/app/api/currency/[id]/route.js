import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const currency = await prisma.currency.findUnique({
      where: { currencyId: Number(params.id) },
    });

    if (!currency) {
      return Response.json({ success: false, error: "Currency not found" }, { status: 404 });
    }

    return Response.json({ success: true, currency });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
