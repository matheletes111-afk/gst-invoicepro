import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      where: {
        status: 'A',
        isDeleted: 0
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: units
    })

  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}