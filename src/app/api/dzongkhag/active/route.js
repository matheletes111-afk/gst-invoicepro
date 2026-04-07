import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const dzongkhags = await prisma.dzongkhag.findMany({
      where: { status: "A" }, // only active
      orderBy: { name: "asc" }
    });

    return Response.json({ success: true, dzongkhags });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
