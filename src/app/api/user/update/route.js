// src/app/api/user/update/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isSuperAdminFromRequest } from "@/lib/auth";

export async function PUT(req) {
    try {
        // Check if user is super admin
        const isAdmin = await isSuperAdminFromRequest(req);
        if (!isAdmin) {
            return NextResponse.json({ 
                success: false,
                error: "Unauthorized: Only super admin can update users" 
            }, { status: 403 });
        }

        const { userId, name, email, roles } = await req.json();

        // Validation
        if (!userId) {
            return NextResponse.json({ 
                success: false,
                error: "User ID is required" 
            }, { status: 400 });
        }

        if (!email) {
            return NextResponse.json({ 
                success: false,
                error: "Email is required" 
            }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                organization: {
                    select: {
                        id: true,
                        orgType: true
                    }
                }
            }
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
            where: { id: parseInt(userId) },
            data: {
                name: name || null,
                email,
                roles: roles || null,
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        orgType: true
                    }
                }
            }
        });

        // Log activity
        try {
            const user = await isSuperAdminFromRequest(req, true);
            if (user?.id) {
                const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
                const userAgent = req.headers.get('user-agent') || 'unknown';

                await prisma.activityLog.create({
                    data: {
                        userId: user.id,
                        action: 'UPDATE',
                        module: 'user',
                        description: `Updated user: ${email}`,
                        ipAddress,
                        userAgent,
                        payload: { userId, name, email, roles },
                    },
                });
            }
        } catch (logError) {
            console.error('Activity logging failed:', logError);
        }

        return NextResponse.json({ 
            success: true,
            message: "User updated successfully", 
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles,
                organization: updatedUser.organization,
                createdAt: updatedUser.createdAt
            }
        });

    } catch (e) {
        console.error("Update user error:", e);
        return NextResponse.json({ 
            success: false,
            error: e.message 
        }, { status: 500 });
    }
}

// GET single user by ID
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json({ 
                success: false,
                error: "User ID is required" 
            }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                organization: {
                    select: {
                        id: true,
                        orgType: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ 
                success: false,
                error: "User not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                organization: user.organization,
                createdAt: user.createdAt,
                status: user.status
            }
        });

    } catch (e) {
        console.error("Get user error:", e);
        return NextResponse.json({ 
            success: false,
            error: e.message 
        }, { status: 500 });
    }
}