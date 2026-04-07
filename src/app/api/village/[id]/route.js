import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const village = await prisma.village.findUnique({
      where: { villageId: Number(id) },
    });

    if (!village || village.status === "D") {
      return Response.json(
        { success: false, error: "Village not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, village });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
