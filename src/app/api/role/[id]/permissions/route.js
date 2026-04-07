// src/app/api/role/[id]/permissions/route.js
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/role/[id]/permissions - Get role permissions
export async function GET(req, { params }) {
  try {
    const { id } = params

    const permissions = await prisma.RoleToPermission.findMany({
      where: { roleId: parseInt(id) },
      include: {
        menu: true
      }
    })

    return Response.json({ success: true, data: permissions })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/role/[id]/permissions - Update role permissions
export async function POST(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()
    const { menuIds } = body

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.RoleToPermission.deleteMany({
        where: { roleId: parseInt(id) }
      })

      // Create new permissions
      if (menuIds && menuIds.length > 0) {
        await tx.RoleToPermission.createMany({
          data: menuIds.map(menuId => ({
            roleId: parseInt(id),
            menuId
          }))
        })
      }

      // Get updated permissions
      return await tx.RoleToPermission.findMany({
        where: { roleId: parseInt(id) },
        include: { menu: true }
      })
    })

    // Log activity
    try {
      const user = await getUserFromRequest(req)
      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'
        const pathname = req.nextUrl.pathname

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            module: 'role_permissions',
            description: `Updated permissions for role ID: ${id}`,
            ipAddress,
            userAgent,
            payload: { menuIds },
          },
        })
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError)
    }

    return Response.json({
      success: true,
      message: "Permissions updated successfully",
      data: result
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}