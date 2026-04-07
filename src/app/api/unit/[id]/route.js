import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return Response.json({ error: "Invalid unit ID" }, { status: 400 });
    }

    // Get unit information
    const unit = await prisma.unit.findUnique({
      where: { 
        id: id,
        isDeleted: 0 
      }
    });

    if (!unit) {
      return Response.json({ error: "Unit not found" }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      unit
    });
  } catch (error) {
    console.error("Get unit error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}