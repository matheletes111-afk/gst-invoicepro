// src/app/api/role/list/route.js
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/role/list - List roles with pagination
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    const sortBy = searchParams.get("sortBy") || "roleName"
    const sortDir = searchParams.get("sortDir") || "asc"

    const search = searchParams.get("search") || ""

    // Build where condition
    let where = {
      status: { in: ["A", "I"] },
      ...(search
        ? {
            OR: [
              { roleName: { contains: search } },
              { roleDescription: { contains: search } }
            ]
          }
        : {})
    }

    const total = await prisma.Role.count({ where })

    const data = await prisma.Role.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        _count: {
          select: { permissions: true }
        }
      }
    })

    return Response.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/role/list - Soft delete role
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { roleId } = body

    // Log activity
    try {
      const user = await getUserFromRequest(req)
      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'
        const pathname = req.nextUrl.pathname
        const method = req.method

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'DELETE',
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: body,
          },
        })
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError)
    }

    if (!roleId) {
      return Response.json({ success: false, error: "Role ID required" }, { status: 400 })
    }

    const exists = await prisma.Role.findUnique({
      where: { id: parseInt(roleId) },
    })

    if (!exists) {
      return Response.json({ success: false, error: "Role not found" }, { status: 404 })
    }

    await prisma.Role.update({
      where: { id: parseInt(roleId) },
      data: { status: "I" },
    })

    return Response.json({ success: true, message: "Role deactivated successfully" })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}