import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const dzongkhagId = parseInt(params.dzongkhagId);
    
    const gewogs = await prisma.gewog.findMany({
      where: { 
        dzongkhagId,
        status: "A" 
      },
      orderBy: { name: "asc" }
    });

    return Response.json({ success: true, gewogs });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}