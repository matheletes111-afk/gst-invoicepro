import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isPathAllowedForUser, normalizePathname } from "@/lib/routeAccess";

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = [
        "/",              // Landing page
        "/pricing",       // Pricing page
        "/login",        
        "/forgot-password",
        "/register"       // Note: register is special - only super admin can access
    ];

    // Check if current path is a public path
    if (publicPaths.includes(pathname)) {
        // Special handling for /register - only super admin can access
        if (pathname === "/register") {
            const token = req.cookies.get("token")?.value;
            
            if (!token) {
                console.log("[Middleware] No token found for /register");
                return NextResponse.redirect(new URL("/login", req.url));
            }

            try {
                if (!process.env.JWT_SECRET) {
                    console.error("[Middleware] JWT_SECRET not set");
                    return NextResponse.redirect(new URL("/login", req.url));
                }

                // Use jose for Edge Runtime compatibility
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                
                const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
                
                console.log("[Middleware] Checking admin access for /register:", {
                    userEmail: payload.email,
                    superAdminEmail: superAdminEmail,
                    match: payload.email === superAdminEmail
                });
                
                // Check if user is super admin
                if (!superAdminEmail) {
                    console.error("[Middleware] SUPER_ADMIN_EMAIL not set in environment");
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                }
                
                if (payload.email !== superAdminEmail) {
                    console.log("[Middleware] User is not super admin for /register, redirecting to /dashboard");
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                }
                
                return NextResponse.next();
            } catch (error) {
                console.error("[Middleware] JWT verification error for /register:", error.message);
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }
        
        // For other public paths (/pricing, /, etc.), allow access without authentication
        return NextResponse.next();
    }

    // Protect organization create page - only super admin can access
    if (pathname === "/organization/create") {
        const token = req.cookies.get("token")?.value;
        
        if (!token) {
            console.log("[Middleware] No token found for /organization/create");
            return NextResponse.redirect(new URL("/login", req.url));
        }

        try {
            if (!process.env.JWT_SECRET) {
                console.error("[Middleware] JWT_SECRET not set");
                return NextResponse.redirect(new URL("/login", req.url));
            }

            // Use jose for Edge Runtime compatibility
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            
            const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
            
            console.log("[Middleware] Checking admin access:", {
                userEmail: payload.email,
                superAdminEmail: superAdminEmail,
                match: payload.email === superAdminEmail
            });
            
            // Check if user is super admin
            if (!superAdminEmail) {
                console.error("[Middleware] SUPER_ADMIN_EMAIL not set in environment");
                return NextResponse.redirect(new URL("/organization", req.url));
            }
            
            if (payload.email !== superAdminEmail) {
                console.log("[Middleware] User is not super admin, redirecting to /organization");
                return NextResponse.redirect(new URL("/organization", req.url));
            }
            
            console.log("[Middleware] Super admin access granted");
            return NextResponse.next();
        } catch (error) {
            console.error("[Middleware] JWT verification error for /organization/create:", error.message);
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // For all other paths, require authentication
    const token = req.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not set in environment variables");
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Convert JWT_SECRET to Uint8Array for jose
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        const { payload } = await jwtVerify(token, secret);

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        if (superAdminEmail && payload.email === superAdminEmail) {
            return NextResponse.next();
        }

        const pathNorm = normalizePathname(pathname);
        console.log(`[Middleware] Processing path: ${pathname} (Normalized: ${pathNorm})`);
        
        if (pathNorm === "/dashboard") {
            console.log("[Middleware] Dashbord path detected, allowing access");
            return NextResponse.next();
        }

        const accessRes = await fetch(new URL("/api/auth/sidebar-access", "http://localhost:3000"), {
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        });

        console.log(`[Middleware] Sidebar-access response status: ${accessRes.status}`);

        if (accessRes.status === 401) {
            console.log("[Middleware] Sidebar-access returned 401, redirecting to /login");
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const data = await accessRes.json().catch(() => ({}));
        console.log(`[Middleware] Sidebar-access data success: ${data.success}`);

        if (!data.success) {
            console.log(`[Middleware] Access denied (success=false), redirecting to /dashboard?access_denied=1`);
            const deny = new URL("/dashboard", req.url);
            deny.searchParams.set("access_denied", "1");
            return NextResponse.redirect(deny);
        }

        const allowed = isPathAllowedForUser(pathname, {
            isSuperAdmin: data.isSuperAdmin === true,
            allowedEndpoints: data.allowedEndpoints,
        });

        console.log(`[Middleware] Path allowed: ${allowed}`);

        if (!allowed) {
            console.log(`[Middleware] Access denied (role check), redirecting to /dashboard?access_denied=1`);
            const deny = new URL("/dashboard", req.url);
            deny.searchParams.set("access_denied", "1");
            return NextResponse.redirect(deny);
        }

        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        console.error("JWT verification failed:", error.message);
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         * - logo.jpeg (public logo - must be served without auth so login page can show it)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|images|logo\\.jpeg).*)",
    ],
};