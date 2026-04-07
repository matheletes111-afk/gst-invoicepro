// src/app/api/user/[id]/update/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isSuperAdminFromRequest } from "@/lib/auth";

export async function PUT(req, context) {
  try {
    const params = await Promise.resolve(context.params);
    const rawId = params?.id;
    const idNum =
      rawId != null && rawId !== "undefined" && rawId !== "null"
        ? parseInt(String(rawId), 10)
        : NaN;

    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid user ID is required" },
        { status: 400 }
      );
    }

    // Check if user is super admin
    const isAdmin = await isSuperAdminFromRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized: Only super admin can update users" 
      }, { status: 403 });
    }

    const { name, email, roles } = await req.json();

    if (!email) {
      return NextResponse.json({ 
        success: false,
        error: "Email is required" 
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid email format" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: idNum }
    });

    if (!existingUser) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    }

    // Check if email is taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      
      if (emailExists) {
        return NextResponse.json({ 
          success: false,
          error: "Email already in use by another user" 
        }, { status: 409 });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: idNum },
      data: {
        name: name || null,
        email,
        roles: roles || null,
      }
      // REMOVED the include for organization
    });

    // Log activity
    try {
      const admin = await isSuperAdminFromRequest(req, true);
      if (admin?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await prisma.activityLog.create({
          data: {
            userId: admin.id,
            action: 'UPDATE',
            module: 'user',
            description: `Updated user: ${email}`,
            ipAddress,
            userAgent,
            payload: { userId: idNum, name, email, roles },
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ 
      success: true,
      message: "User updated successfully", 
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}