// src/app/api/role/create/route.js
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(req) {
  try {
    const body = await req.json()
    const { roleName, roleDescription, status } = body

    // Validate
    if (!roleName) {
      return Response.json({ success: false, error: "Role name is required" }, { status: 400 })
    }

    // Check for duplicate
    const existing = await prisma.Role.findUnique({
      where: { roleName }
    })

    if (existing) {
      return Response.json({ success: false, error: "Role name already exists" }, { status: 400 })
    }

    // Create role
    const role = await prisma.Role.create({
      data: {
        roleName,
        roleDescription,
        status: status || "A"
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
            action: 'CREATE',
            module: 'role',
            description: `Created role: ${roleName}`,
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
      message: "Role created successfully",
      data: role
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}