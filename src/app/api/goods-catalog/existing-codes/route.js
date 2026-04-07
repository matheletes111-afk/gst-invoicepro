import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Only get records with status A or I, NOT D
    const existingGoods = await prisma.goodsCatalog.findMany({
      where: {
        status: { in: ["A", "I"] }  // Only Active or Inactive
      },
      select: {
        goodsCode: true,
        goodsName: true,
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      data: existingGoods
    })

  } catch (error) {
    console.error("Error fetching existing codes:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}