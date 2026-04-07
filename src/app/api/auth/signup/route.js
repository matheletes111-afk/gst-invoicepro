// src/app/api/auth/signup/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { isSuperAdminFromRequest } from "@/lib/auth";

export async function POST(req) {
    try {
        // Only super admin can create users
        const isAdmin = await isSuperAdminFromRequest(req);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized: Only super admin can create users" }, { status: 403 });
        }

        const { name, email, password, organizationId, roles } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
        }

        // Validate that organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: parseInt(organizationId) },
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                organizationId: parseInt(organizationId),
                roles: roles || null, // Save comma-separated role IDs
            },
        });

        return NextResponse.json({ 
            success: true,
            message: "User created successfully", 
            user 
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}