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


    const {
      businessLicenseNo,
      dealerName,
      taxpayerRegStatus,
      taxpayerRegNo,
      taxpayerRegRegion,
      dzongkhagId,
      gewogId,
      villageId,
      location,
      contactName,
      contactEmail,
      contactPhone,
      status
    } = body;

    // Validate required fields
    if (!dealerName) {
      return new Response(JSON.stringify({
        success: false,
        error: "Dealer Name is required."
      }), { status: 400 });
    }

    // If taxpayer registration status is YES, taxpayerRegNo is mandatory
    if (taxpayerRegStatus === "YES" && !taxpayerRegNo) {
      return new Response(JSON.stringify({
        success: false,
        error: "Taxpayer Registration Number is required when registration status is Yes."
      }), { status: 400 });
    }

    // Verify location relations if provided
    if (dzongkhagId) {
      const dzongkhag = await prisma.Dzongkhag.findUnique({
        where: { dzongkhagId: parseInt(dzongkhagId) }
      });
      if (!dzongkhag) {
        return new Response(JSON.stringify({
          success: false,
          error: "Dzongkhag not found."
        }), { status: 404 });
      }
    }

    if (gewogId) {
      const gewog = await prisma.Gewog.findUnique({
        where: { gewogId: parseInt(gewogId) }
      });
      if (!gewog) {
        return new Response(JSON.stringify({
          success: false,
          error: "Gewog not found."
        }), { status: 404 });
      }
    }

    if (villageId) {
      const village = await prisma.Village.findUnique({
        where: { villageId: parseInt(villageId) }
      });
      if (!village) {
        return new Response(JSON.stringify({
          success: false,
          error: "Village not found."
        }), { status: 404 });
      }
    }

    // Create new record
    const dealer = await prisma.dealerMaster.create({
      data: {
        businessLicenseNo: businessLicenseNo || null,
        dealerName,
        taxpayerRegStatus: taxpayerRegStatus || "NO",
        taxpayerRegNo: taxpayerRegNo || null,
        taxpayerRegRegion: taxpayerRegRegion || null,
        dzongkhagId: dzongkhagId ? parseInt(dzongkhagId) : null,
        gewogId: gewogId ? parseInt(gewogId) : null,
        villageId: villageId ? parseInt(villageId) : null,
        location: location || null,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
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
            payload: dealer,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Dealer created successfully",
      dealer
    }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

