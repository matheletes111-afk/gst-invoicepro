import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    
    const { id, service_name, service_code, description, remarks, status } = body;

    if (!id) {
      return Response.json({ error: "Service ID is required" }, { status: 400 });
    }

    // -----------------------------------------------
    // Check duplicates (service_name or service_code)
    // Exclude its own ID
    // Only check status A or I
    // -----------------------------------------------
    const duplicate = await prisma.serviceCatalog.findFirst({
      where: {
        OR: [
          { service_name: service_name },
          { service_code: service_code }
        ],
        status: { in: ["A", "I"] },
        service_id: { not: Number(id) }
      }
    });

    if (duplicate) {
      return Response.json({
        error: "Service Name or Service Code already exists."
      }, { status: 400 });
    }

    // -----------------------------------------------
    // Update Service Catalog
    // -----------------------------------------------
    const service = await prisma.serviceCatalog.update({
      where: { service_id: Number(id) },
      data: {
        service_name,
        service_code,
        description,
        remarks,
        status
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
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
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

    return Response.json({ success: true, service });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
