import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getOrganizationIdFromRequest } from "@/lib/auth"
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const body = await req.json()


    const { services } = body

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({
        success: false,
        error: "Invalid data format"
      }, { status: 400 })
    }

    const results = []
    const errors = []
    let createdCount = 0

    // Process each service item
    for (const item of services) {
      try {
        // Validate required fields for each item
        if (!item.service_name || !item.service_code) {
          errors.push({
            service_code: item.service_code || "N/A",
            error: "service_name and service_code are required"
          })
          continue
        }

        // Check if service_code already exists with status A or I within the same organization
        const existing = await prisma.ServiceCatalog.findFirst({
          where: {
            service_code: item.service_code,
            organizationId: organizationId,
            status: { in: ["A", "I"] }
          }
        })

        if (existing) {
          errors.push({
            service_code: item.service_code,
            error: "Service code already exists with status Active/Inactive in your organization"
          })
          continue
        }

        // Create service with organizationId
        const createdService = await prisma.ServiceCatalog.create({
          data: {
            service_name: item.service_name,
            service_code: item.service_code,
            service_description: item.service_description || null,
            status: item.status || "A",
            organizationId: organizationId // Add organizationId here
          }
        })


        // Log activity
        try {
          const user = await getUserFromRequest(req);

          if (user?.id) {
            const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
            const userAgent = req.headers.get('user-agent') || 'unknown';
            const pathname = req.nextUrl.pathname;
            const method = req.method;

            const { default: prisma } = await import('@/lib/prisma');

            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action: 'BULK_UPLOAD',  //CREATE, UPDATE, DELETE
                module: pathname.split('/')[2] || 'unknown',
                description: `${method} ${pathname}`,
                ipAddress,
                userAgent,
                payload: createdService,
              },
            });
          }
        } catch (logError) {
          console.error('Activity logging failed:', logError);
        }

        results.push(createdService)
        createdCount++

      } catch (error) {
        errors.push({
          service_code: item.service_code || "N/A",
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      total: services.length,
      errors,
      data: results
    })

  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}