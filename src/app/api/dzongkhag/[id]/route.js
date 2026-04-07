import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const dzongkhag = await prisma.Dzongkhag.findUnique({
      where: { dzongkhagId: Number(id) },
    });

    if (!dzongkhag || dzongkhag.status === "D") {
      return Response.json({ success: false, error: "Dzongkhag not found" }, { status: 404 });
    }

    return Response.json({ success: true, dzongkhag });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
