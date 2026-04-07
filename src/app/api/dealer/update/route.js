import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

   
    const {
      id,
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

    if (!id) {
      return Response.json({ error: "Dealer ID is required" }, { status: 400 });
    }

    // If taxpayer registration status is YES, taxpayerRegNo is mandatory
    if (taxpayerRegStatus === "YES" && !taxpayerRegNo) {
      return Response.json({
        error: "Taxpayer Registration Number is required when registration status is Yes."
      }, { status: 400 });
    }

    // Verify location relations if provided
    if (dzongkhagId) {
      const dzongkhag = await prisma.Dzongkhag.findUnique({
        where: { dzongkhagId: parseInt(dzongkhagId) }
      });
      if (!dzongkhag) {
        return Response.json({
          error: "Dzongkhag not found."
        }, { status: 404 });
      }
    }

    if (gewogId) {
      const gewog = await prisma.Gewog.findUnique({
        where: { gewogId: parseInt(gewogId) }
      });
      if (!gewog) {
        return Response.json({
          error: "Gewog not found."
        }, { status: 404 });
      }
    }

    if (villageId) {
      const village = await prisma.Village.findUnique({
        where: { villageId: parseInt(villageId) }
      });
      if (!village) {
        return Response.json({
          error: "Village not found."
        }, { status: 404 });
      }
    }

    // Update Dealer
    const updateData = {};
    if (businessLicenseNo !== undefined) updateData.businessLicenseNo = businessLicenseNo || null;
    if (dealerName) updateData.dealerName = dealerName;
    if (taxpayerRegStatus) updateData.taxpayerRegStatus = taxpayerRegStatus;
    if (taxpayerRegNo !== undefined) updateData.taxpayerRegNo = taxpayerRegNo || null;
    if (taxpayerRegRegion !== undefined) updateData.taxpayerRegRegion = taxpayerRegRegion || null;
    if (dzongkhagId !== undefined) updateData.dzongkhagId = dzongkhagId ? parseInt(dzongkhagId) : null;
    if (gewogId !== undefined) updateData.gewogId = gewogId ? parseInt(gewogId) : null;
    if (villageId !== undefined) updateData.villageId = villageId ? parseInt(villageId) : null;
    if (location !== undefined) updateData.location = location || null;
    if (contactName !== undefined) updateData.contactName = contactName || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;
    if (status) updateData.status = status;

    const dealer = await prisma.dealerMaster.update({
      where: { dealerId: Number(id) },
      data: updateData
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
            payload: dealer,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }

    return Response.json({ success: true, dealer });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

