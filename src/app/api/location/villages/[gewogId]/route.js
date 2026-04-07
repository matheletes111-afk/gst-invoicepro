import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const gewogId = parseInt(params.gewogId);
    
    const villages = await prisma.village.findMany({
      where: { 
        gewogId,
        status: "A" 
      },
      orderBy: { name: "asc" }
    });

    return Response.json({ success: true, villages });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}