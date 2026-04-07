import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const dzongkhags = await prisma.dzongkhag.findMany({
      where: { status: "A" },
      orderBy: { name: "asc" }
    });

    return Response.json({ success: true, dzongkhags });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}