import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        const user = await prisma.user.findUnique({ 
            where: { email },
            include: { organization: true }
        });

        if (!user)
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const match = await compare(password, user.password);

        if (!match)
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        if (!user.organizationId) {
            return NextResponse.json({ error: "User is not assigned to an organization" }, { status: 403 });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, organizationId: user.organizationId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Create response with token in JSON (exclude password from user object)
        const { password: _, ...userWithoutPassword } = user;
        const response = NextResponse.json({ token, user: userWithoutPassword });

        // Set cookie with token (7 days expiration)
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        response.cookies.set("token", token, {
            expires: expires,
            path: "/",
            sameSite: "lax",
            httpOnly: false, // Set to false so client can also read it if needed
        });

        // 🔥 ADDED: Log successful login activity
        try {
            // Extract IP address from request headers
            const ipAddress = req.headers.get('x-forwarded-for') || 
                            req.headers.get('cf-connecting-ip') || 
                            req.ip || 
                            'unknown';
            
            // Extract user agent
            const userAgent = req.headers.get('user-agent') || 'unknown';

            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    action: "LOGIN",
                    module: "auth",
                    description: "User logged in successfully",
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });
            
            console.log(`[Activity Log] User ${user.email} logged in from ${ipAddress}`);
        } catch (logError) {
            // Don't fail the login if logging fails
            console.error("Failed to log login activity:", logError);
        }

        return response;
    } catch (err) {
        // 🔥 ADDED: Log failed login attempt
        try {
            const ipAddress = req.headers.get('x-forwarded-for') || 
                            req.headers.get('cf-connecting-ip') || 
                            req.ip || 
                            'unknown';
            
            const userAgent = req.headers.get('user-agent') || 'unknown';

            await prisma.activityLog.create({
                data: {
                    userId: null, // No user ID for failed attempts
                    action: "LOGIN_FAILED",
                    module: "auth",
                    description: `Failed login attempt for email: ${email}`,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    payload: { attemptedEmail: email, error: err.message },
                },
            });
            
            console.log(`[Activity Log] Failed login attempt for ${email} from ${ipAddress}`);
        } catch (logError) {
            console.error("Failed to log failed login activity:", logError);
        }

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}