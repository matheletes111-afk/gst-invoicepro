import prisma from "@/lib/prisma";
import { isSuperAdminFromRequest } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    // Only super admin can create organizations
    const isAdmin = await isSuperAdminFromRequest(req);
    if (!isAdmin) {
      return Response.json({
        error: "Unauthorized: Only super admin can create organizations"
      }, { status: 403 });
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
      orgType,
      status = "A",
      // Common fields
      contactPerson,
      contactEmail,
      contactPhone,
      taxpayerRegistrationRegion,
      registrationType,
      // Type-specific fields
      businessDetails,
      governmentAgencyDetails,
      corporationDetails,
      csoDetails
    } = body;

    // Create organization with related details based on type
    const organization = await prisma.$transaction(async (tx) => {
      // 1. Create base organization
      const org = await tx.organization.create({
        data: {
          orgType,
          status
        }
      });

      // 2. Create type-specific details
      let details = null;

      switch (orgType) {
        case "business":
          if (businessDetails) {
            details = await tx.businessDetails.create({
              data: {
                organizationId: org.id,
                businessName: businessDetails.businessName,
                businessNameCode: businessDetails.businessNameCode,
                licenseNo: businessDetails.licenseNo,
                companyRegistrationNo: businessDetails.companyRegistrationNo,
                taxpayerNumber: businessDetails.taxpayerNumber,
                taxpayerType: businessDetails.taxpayerType,
                taxpayerRegistrationRegion: businessDetails.taxpayerRegistrationRegion,
                businessLicenseRegion: businessDetails.businessLicenseRegion,
                businessLocationJson: businessDetails.businessLocation,
                officeLocationJson: businessDetails.officeLocation,
                ownershipType: businessDetails.ownershipType,
                proprietorJson: businessDetails.proprietor,
                partnersJson: businessDetails.partners,
                registeredCompanyJson: businessDetails.registeredCompany
              }
            });
          }
          break;

        case "government":
          if (governmentAgencyDetails) {
            details = await tx.governmentAgencyDetails.create({
              data: {
                organizationId: org.id,
                agencyName: governmentAgencyDetails.agencyName,
                agencyCode: governmentAgencyDetails.agencyCode,
                tpn: governmentAgencyDetails.tpn,
                taxpayerRegistrationRegion: governmentAgencyDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
                registrationType: governmentAgencyDetails.registrationType || registrationType,
                contactPerson: governmentAgencyDetails.contactPerson || contactPerson,
                contactEmail: governmentAgencyDetails.contactEmail || contactEmail,
                contactPhone: governmentAgencyDetails.contactPhone || contactPhone
              }
            });
          }
          break;

        case "corporation":
          if (corporationDetails) {
            details = await tx.corporationDetails.create({
              data: {
                organizationId: org.id,
                corporationName: corporationDetails.corporationName,
                organizationCode: corporationDetails.organizationCode,
                tpn: corporationDetails.tpn,
                taxpayerRegistrationRegion: corporationDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
                registrationType: corporationDetails.registrationType || registrationType,
                contactPerson: corporationDetails.contactPerson || contactPerson,
                contactEmail: corporationDetails.contactEmail || contactEmail,
                contactPhone: corporationDetails.contactPhone || contactPhone
              }
            });
          }
          break;

        case "cso":
          if (csoDetails) {
            details = await tx.csoDetails.create({
              data: {
                organizationId: org.id,
                agencyName: csoDetails.agencyName,
                agencyCode: csoDetails.agencyCode,
                registrationNo: csoDetails.registrationNo,
                tpn: csoDetails.tpn,
                taxpayerRegistrationRegion: csoDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
                registrationType: csoDetails.registrationType || registrationType,
                contactPerson: csoDetails.contactPerson || contactPerson,
                contactEmail: csoDetails.contactEmail || contactEmail,
                contactPhone: csoDetails.contactPhone || contactPhone
              }
            });
          }
          break;
      }

      return { ...org, details };
    });

    return Response.json({ success: true, organization });
  } catch (error) {
    console.error("Error creating organization:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}