// src/app/api/user/organization/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization ID is required" 
      }, { status: 400 });
    }

    // Get organization with all available fields
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(id) }
    });

    if (!organization) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization not found" 
      }, { status: 404 });
    }

    // Get user count
    const userCount = await prisma.user.count({
      where: { organizationId: parseInt(id) }
    });

    return NextResponse.json({ 
      success: true, 
      organization: {
        ...organization,
        userCount
      }
    });

  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}