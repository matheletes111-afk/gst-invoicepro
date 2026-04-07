import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "partyId";
    const sortDir = searchParams.get("sortDir") || "desc";

    const search = searchParams.get("search") || "";
    const partyType = searchParams.get("partyType") || "";

    let where = {
      isDeleted: 0,
      organizationId: organizationId // Filter by user's organization
    };

    // Add party type filter if specified
    if (partyType) {
      where.partyType = partyType;
    }

    // Search functionality
    if (search) {
      where.OR = [
        // Search in base party (if there were searchable fields)
        // For now, we'll search in type-specific tables through subqueries
        
        // We'll handle search separately with raw query or multiple queries
        // This is a simplified version - you might want to optimize based on your needs
      ];
    }

    // Get total count
    const total = await prisma.party.count({ where });

    // Get parties with pagination
    const parties = await prisma.party.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        // Include all possible relations - only one will have data based on partyType
        businessParty: true,
        governmentAgencyParty: true,
        corporationParty: true,
        csoParty: true,
        individualParty: true
      }
    });

    // Transform the data to make it easier to use
    const transformedParties = parties.map(party => {
      // Get the appropriate type-specific data based on partyType
      let details = null;
      let displayName = '';
      
      switch (party.partyType) {
        case 'BUSINESS':
          details = party.businessParty;
          displayName = details?. businessName || 'Business';
          break;
        case 'GOVERNMENT_AGENCY':
          details = party.governmentAgencyParty;
          displayName = details?.agencyName || 'Government Agency';
          break;
        case 'CORPORATION':
          details = party.corporationParty;
          displayName = details?.corporationName || 'Corporation';
          break;
        case 'CSO':
          details = party.csoParty;
          displayName = details?.csoName || 'CSO';
          break;
        case 'INDIVIDUAL':
          details = party.individualParty;
          displayName = details?.name || 'Individual';
          break;
      }

      // Remove all the relation fields and add only the relevant details
      const { 
        businessParty, 
        governmentAgencyParty, 
        corporationParty, 
        csoParty, 
        individualParty,
        ...partyWithoutRelations 
      } = party;

      return {
        ...partyWithoutRelations,
        details,
        displayName
      };
    });

    return Response.json({
      success: true,
      parties: transformedParties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("List parties error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

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
            action: 'DELETE',  //CREATE, UPDATE, DELETE
            module: pathname.split('/')[2] || 'unknown',
            description: `${method} ${pathname}`,
            ipAddress,
            userAgent,
            payload: body,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    const { partyId } = body;

    if (!partyId) {
      return Response.json({ success: false, error: "Party ID required" }, { status: 400 });
    }

    const existingParty = await prisma.party.findUnique({
      where: { partyId: parseInt(partyId) },
    });

    if (!existingParty || existingParty.isDeleted === 1) {
      return Response.json({ success: false, error: "Party not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.party.update({
      where: { partyId: parseInt(partyId) },
      data: {
        isDeleted: 1,
        status: 'I'
      }
    });

    return Response.json({ 
      success: true, 
      message: "Party deleted successfully (soft delete)" 
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}