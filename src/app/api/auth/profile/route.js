import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getUserFromRequest } from "@/lib/auth";

// PATCH - Update current user profile (name, email with unique check, optional password)
export async function PATCH(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, newPassword } = body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }

    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      // Unique check: no other user (excluding current) may have this email
      const existing = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          id: { not: user.id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This email is already in use by another account" },
          { status: 409 }
        );
      }
      updateData.email = trimmedEmail;
    }

    if (newPassword !== undefined && newPassword !== "") {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateData.password = await hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
