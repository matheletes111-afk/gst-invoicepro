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
            payload: body,
          },
        });
      }
    } catch (logError) {
      console.error('Activity logging failed:', logError);
    }
    const { 
      partyType, 
      status,
      // Common fields for all party types
      taxPayerRegStatus,
      taxPayerRegNo,
      taxPayerRegion,
      address,
      officeEmail,
      officePhone,
      contactName,
      contactEmail,
      contactPhone,
      // Type-specific fields
      ...typeSpecificData
    } = body;

    if (!partyType) {
      return new Response(
        JSON.stringify({ error: "Party type is required" }), 
        { status: 400 }
      );
    }

    // Create base party record
    const party = await prisma.Party.create({
      data: {
        partyType,
        organizationId: organizationId,
        status: status || 'A'
      }
    });

    // Create type-specific record based on partyType
    let typeSpecificRecord = null;

    switch (partyType) {
      case 'BUSINESS':
        if (typeSpecificData) {
          typeSpecificRecord = await prisma.BusinessParty.create({
            data: {
              partyId: party.partyId,
              licenseNo: typeSpecificData.licenseNo,
              businessName: typeSpecificData.businessName,
              companyRegistrationNo: typeSpecificData.companyRegistrationNo,
              businessLicenseRegion: typeSpecificData.businessLicenseRegion,
              taxPayerRegStatus: taxPayerRegStatus || 'NO',
              taxPayerRegNo: taxPayerRegNo,
              taxPayerRegion: taxPayerRegion,
              address: address,
              officeEmail: officeEmail,
              officePhone: officePhone,
              representativeName: contactName || typeSpecificData.representativeName,
              representativeEmail: contactEmail || typeSpecificData.representativeEmail,
              representativePhone: contactPhone || typeSpecificData.representativePhone
            }
          });
        }
        break;

      case 'GOVERNMENT_AGENCY':
        if (typeSpecificData) {
          typeSpecificRecord = await prisma.GovernmentAgencyParty.create({
            data: {
              partyId: party.partyId,
              agencyName: typeSpecificData.agencyName,
              taxPayerRegStatus: taxPayerRegStatus || 'NO',
              taxPayerRegNo: taxPayerRegNo,
              taxPayerRegion: taxPayerRegion,
              address: address,
              officeEmail: officeEmail,
              officePhone: officePhone,
              contactName: contactName,
              contactEmail: contactEmail,
              contactPhone: contactPhone
            }
          });
        }
        break;

      case 'CORPORATION':
        if (typeSpecificData) {
          typeSpecificRecord = await prisma.CorporationParty.create({
            data: {
              partyId: party.partyId,
              corporationName: typeSpecificData.corporationName,
              taxPayerRegStatus: taxPayerRegStatus || 'NO',
              taxPayerRegNo: taxPayerRegNo,
              taxPayerRegion: taxPayerRegion,
              address: address,
              officeEmail: officeEmail,
              officePhone: officePhone,
              contactName: contactName,
              contactEmail: contactEmail,
              contactPhone: contactPhone
            }
          });
        }
        break;

      case 'CSO':
        if (typeSpecificData) {
          typeSpecificRecord = await prisma.CSOParty.create({
            data: {
              partyId: party.partyId,
              csoRegistrationNo: typeSpecificData.csoRegistrationNo,
              csoName: typeSpecificData.csoName,
              taxPayerRegStatus: taxPayerRegStatus || 'NO',
              taxPayerRegNo: taxPayerRegNo,
              taxPayerRegion: taxPayerRegion,
              address: address,
              officeEmail: officeEmail,
              officePhone: officePhone,
              contactName: contactName,
              contactEmail: contactEmail,
              contactPhone: contactPhone
            }
          });
        }
        break;

      case 'INDIVIDUAL':
        if (typeSpecificData) {
          typeSpecificRecord = await prisma.IndividualParty.create({
            data: {
              partyId: party.partyId,
              cid: typeSpecificData.cid,
              name: typeSpecificData.name,
              taxPayerRegStatus: taxPayerRegStatus || 'NO',
              taxPayerRegNo: taxPayerRegNo,
              taxPayerRegion: taxPayerRegion,
              email: officeEmail || contactEmail || typeSpecificData.email,
              phone: officePhone || contactPhone || typeSpecificData.phone
            }
          });
        }
        break;

      default:
        throw new Error(`Unsupported party type: ${partyType}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Party created successfully",
        party,
        typeSpecificRecord
      }), 
      { status: 201 }
    );
  } catch (error) {
    console.error("Create party error:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}