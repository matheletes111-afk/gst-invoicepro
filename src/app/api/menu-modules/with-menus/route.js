// src/app/api/menu-modules/with-menus/route.js
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const modules = await prisma.MenuModules.findMany({
      include: {
        menus: {
          orderBy: {
            menuName: 'asc'
          }
        }
      },
      orderBy: {
        moduleName: 'asc'
      }
    })

    return Response.json({
      success: true,
      data: modules
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}