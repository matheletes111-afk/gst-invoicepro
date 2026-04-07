import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET - Get current user information with organization details
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with organization details
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          include: {
            businessDetails: true,
            governmentAgencyDetail: true,
            corporationDetail: true,
            csoDetail: true,
          }
        }
      }
    });

    if (!userWithOrg) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract organization name based on type
    let organizationName = "Organization";
    if (userWithOrg.organization) {
      switch (userWithOrg.organization.orgType) {
        case "business":
          organizationName = userWithOrg.organization.businessDetails?.businessName || "Business";
          break;
        case "government":
          organizationName = userWithOrg.organization.governmentAgencyDetail?.agencyName || "Government Agency";
          break;
        case "corporation":
          organizationName = userWithOrg.organization.corporationDetail?.corporationName || "Corporation";
          break;
        case "cso":
          organizationName = userWithOrg.organization.csoDetail?.agencyName || "CSO";
          break;
        default:
          organizationName = "Organization";
      }
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = userWithOrg;

    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        organizationName
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

