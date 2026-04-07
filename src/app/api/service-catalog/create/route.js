import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }), { status: 401 });
    }

    const body = await req.json();
   
    const { service_name, service_code, service_description, status } = body;

    // Validate required fields
    if (!service_name || !service_code) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "service_name and service_code are required." 
      }), { status: 400 });
    }

    // Check if service_code exists with status A or I within the same organization
    const existing = await prisma.ServiceCatalog.findFirst({
      where: {
        service_code: service_code,
        organizationId: organizationId,
        status: { in: ["A", "I"] }   // Active or Inactive
      }
    });

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: "Service code already exists with status Active/Inactive."
      }), { status: 409 }); // Conflict
    }

    // Create new record
    const service = await prisma.ServiceCatalog.create({
      data: {
        service_name,
        service_code,
        service_description,
        organizationId: organizationId,
        status: status ?? "A" // default Active
      }
    });

       // Log activity
    try {
      const user = await getUserFromRequest(req);

      if (user?.id) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const pathname = req.nextUrl.pathname;
        const method = req.method;

        const { default: prisma } = await import('@/lib/prisma');

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'CREATE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: service,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Service created successfully",
      service
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}
