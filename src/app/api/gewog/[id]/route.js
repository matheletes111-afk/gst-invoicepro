import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params; // id = gewogId

    const gewog = await prisma.gewog.findUnique({
      where: { gewogId: Number(id) },
    });

    if (!gewog || gewog.status === "D") {
      return Response.json({ success: false, error: "Gewog not found" }, { status: 404 });
    }

    return Response.json({ success: true, gewog });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
