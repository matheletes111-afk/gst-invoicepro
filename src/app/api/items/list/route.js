// import prisma from "@/lib/prisma";

// export async function GET() {
//     try {
//         const items = await prisma.item.findMany({ orderBy: { itemId: "asc" } });
//         return Response.json({ success: true, items });
//     } catch (error) {
//         return Response.json({ error: error.message }, { status: 500 });
//     }
// }


import prisma from "@/lib/prisma"


// list of items with pagination, sorting, and searching
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "itemId";
    const sortDir = searchParams.get("sortDir") || "asc";

    const search = searchParams.get("search") || "";

    let where = {
          isDeleted: 0, 
        };

    if (search) {
      where = {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { desc: { contains: search } },
          { itemType: { contains: search } }
        ]
      };
    }

    const total = await prisma.item.count({ where });

    const items = await prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        unitObject: true, 
      },
    });

    return Response.json({
      success: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error fetching items:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}






// delete item
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "ID required" }, { status: 400 });
    }

    const existingItem = await prisma.item.findUnique({
      where: { itemId: parseInt(id) },
    });

    if (!existingItem || existingItem.isDeleted === 1) {
      return Response.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.item.update({
      where: { itemId: parseInt(id) },
      data: {
        isDeleted: 1,
        status: "I"
      }
    });

    return Response.json({ success: true, message: "Item deleted successfully (soft delete)" });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
