// src/app/api/role/[id]/route.js
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/role/[id] - Get single role
export async function GET(req, { params }) {
  try {
    const { id } = params

    const role = await prisma.Role.findUnique({
      where: { id: parseInt(id) },
      include: {
        permissions: {
          include: {
            menu: true
          }
        }
      }
    })

    if (!role) {
      return Response.json({ success: false, error: "Role not found" }, { status: 404 })
    }

    return Response.json({ success: true, data: role })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/role/[id] - Update role
export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json()
    const { roleName, roleDescription, status } = body

    // Validate
    if (!roleName) {
      return Response.json({ success: false, error: "Role name is required" }, { status: 400 })
    }

    // Check for duplicate (excluding current role)
    const existing = await prisma.Role.findFirst({
      where: {
        roleName,
        NOT: { id: parseInt(id) }
      }
    })

    if (existing) {
      return Response.json({ success: false, error: "Role name already exists" }, { status: 400 })
    }

    // Update role
    const role = await prisma.Role.update({
      where: { id: parseInt(id) },
      data: {
        roleName,
        roleDescription,
        status
      }
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
            module: 'role',
            description: `Updated role: ${roleName}`,
            ipAddress,
            userAgent,
            payload: body,
          },
        })
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError)
    }

    return Response.json({
      success: true,
      message: "Role updated successfully",
      data: role
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}