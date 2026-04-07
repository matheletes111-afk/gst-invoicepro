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

    const { goods } = body

    if (!goods || !Array.isArray(goods)) {
      return NextResponse.json({
        success: false,
        error: "Invalid data format"
      }, { status: 400 })
    }

    const results = []
    const errors = []
    let createdCount = 0

    // Process each goods item
    for (const item of goods) {
      try {
        // Validate required fields - same as single create
        if (!item.goodsName || !item.goodsCode) {
          errors.push({
            goodsCode: item.goodsCode || "N/A",
            error: "Goods Name and Goods Code are required"
          })
          continue
        }

        if (!item.goodsPrice || parseFloat(item.goodsPrice) <= 0) {
          errors.push({
            goodsCode: item.goodsCode,
            error: "Valid Goods Price is required"
          })
          continue
        }

        if (!item.unitId && !item.unitName) {
          errors.push({
            goodsCode: item.goodsCode,
            error: "Unit is required (provide unitId or unitName)"
          })
          continue
        }

        // Get the desired status from Excel (default to "A" if not specified)
        // Trim whitespace and validate status value
        const rawStatus = item.status?.trim()?.toUpperCase() || "A"
        const desiredStatus = (rawStatus === "A" || rawStatus === "I" || rawStatus === "D") ? rawStatus : "A"

        // Check if goodsCode exists with status A or I within the same organization
        const existing = await prisma.GoodsCatalog.findFirst({
          where: {
            goodsCode: item.goodsCode,
            organizationId: organizationId,
            status: { in: ["A", "I"] }   // Active or Inactive
          }
        });

        if (existing) {
          errors.push({
            goodsCode: item.goodsCode,
            error: "Goods code already exists with status Active/Inactive."
          })
          continue
        }

        // Verify unit exists - NO organization filter needed (units are global)
        let unit;

        if (item.unitId) {
          // Try to find by ID
          unit = await prisma.Unit.findUnique({
            where: { id: parseInt(item.unitId) }
          });
        } else if (item.unitName) {
          // Try to find by name
          unit = await prisma.Unit.findFirst({
            where: {
              name: item.unitName
            }
          });
        }

        if (!unit) {
          errors.push({
            goodsCode: item.goodsCode,
            error: `Unit not found: ${item.unitName || item.unitId}`
          })
          continue
        }

        // Create new goods record with organizationId
        const createdGoods = await prisma.GoodsCatalog.create({
          data: {
            goodsName: item.goodsName,
            goodsCode: item.goodsCode,
            goodsDescription: item.goodsDescription || null,
            goodsPrice: parseFloat(item.goodsPrice),
            unitId: unit.id,
            organizationId: organizationId,
            status: desiredStatus
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
                payload: createdGoods,
              },
            });
          }
        } catch (logError) {
          console.error('Activity logging failed:', logError);
        }

        results.push(createdGoods)
        createdCount++

      } catch (error) {
        console.error("Error processing item:", error)
        // Check if error is due to unique constraint violation
        if (error.code === 'P2002') {
          errors.push({
            goodsCode: item.goodsCode || "N/A",
            error: "Goods code already exists in your organization"
          })
        } else {
          errors.push({
            goodsCode: item.goodsCode || "N/A",
            error: error.message
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      total: goods.length,
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