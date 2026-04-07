import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const existingServices = await prisma.serviceCatalog.findMany({
      where: {
        status: { in: ["A", "I"] }
      },
      select: {
        service_code: true,
        service_name: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      data: existingServices
    })

  } catch (error) {
    console.error("Error fetching existing codes:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}