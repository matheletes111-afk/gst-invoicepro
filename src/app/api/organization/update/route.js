import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
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
            action: 'UPDATE',  //CREATE, UPDATE, DELETE
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
      id,
      status,
      orgType,
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

    if (!id) {
      return Response.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const organization = await prisma.$transaction(async (tx) => {
      // 1. Update base organization
      const org = await tx.organization.update({
        where: { id: parseInt(id) },
        data: {
          status,
          orgType // Note: Changing orgType might require recreating details
        }
      });

      // 2. Update type-specific details
      let details = null;
      
      switch (orgType) {
        case "business":
          if (businessDetails) {
            // Check if business details already exist
            const existing = await tx.businessDetails.findUnique({
              where: { organizationId: org.id }
            });

            const data = {
              businessName: businessDetails.businessName,
              businessNameCode: businessDetails.businessNameCode,
              licenseNo: businessDetails.licenseNo,
              companyRegistrationNo: businessDetails.companyRegistrationNo,
              taxpayerNumber: businessDetails.taxpayerNumber,
              taxpayerType: businessDetails.taxpayerType,
              taxpayerRegistrationRegion: businessDetails.taxpayerRegistrationRegion,
              businessLicenseRegion: businessDetails.businessLicenseRegion,
              businessLocationJson: businessDetails.businessLocationJson,
              officeLocationJson: businessDetails.officeLocationJson,
              ownershipType: businessDetails.ownershipType,
              proprietorJson: businessDetails.proprietorJson,
              partnersJson: businessDetails.partnersJson,
              registeredCompanyJson: businessDetails.registeredCompanyJson
            };

            if (existing) {
              details = await tx.businessDetails.update({
                where: { organizationId: org.id },
                data
              });
            } else {
              details = await tx.businessDetails.create({
                data: {
                  organizationId: org.id,
                  ...data
                }
              });
            }
          }
          break;

        case "government":
          if (governmentAgencyDetails) {
            const existing = await tx.governmentAgencyDetails.findUnique({
              where: { organizationId: org.id }
            });

            const data = {
              agencyName: governmentAgencyDetails.agencyName,
              agencyCode: governmentAgencyDetails.agencyCode,
              tpn: governmentAgencyDetails.tpn,
              taxpayerRegistrationRegion: governmentAgencyDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
              registrationType: governmentAgencyDetails.registrationType || registrationType,
              contactPerson: governmentAgencyDetails.contactPerson || contactPerson,
              contactEmail: governmentAgencyDetails.contactEmail || contactEmail,
              contactPhone: governmentAgencyDetails.contactPhone || contactPhone
            };

            if (existing) {
              details = await tx.governmentAgencyDetails.update({
                where: { organizationId: org.id },
                data
              });
            } else {
              details = await tx.governmentAgencyDetails.create({
                data: {
                  organizationId: org.id,
                  ...data
                }
              });
            }
          }
          break;

        case "corporation":
          if (corporationDetails) {
            const existing = await tx.corporationDetails.findUnique({
              where: { organizationId: org.id }
            });

            const data = {
              corporationName: corporationDetails.corporationName,
              organizationCode: corporationDetails.organizationCode,
              tpn: corporationDetails.tpn,
              taxpayerRegistrationRegion: corporationDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
              registrationType: corporationDetails.registrationType || registrationType,
              contactPerson: corporationDetails.contactPerson || contactPerson,
              contactEmail: corporationDetails.contactEmail || contactEmail,
              contactPhone: corporationDetails.contactPhone || contactPhone
            };

            if (existing) {
              details = await tx.corporationDetails.update({
                where: { organizationId: org.id },
                data
              });
            } else {
              details = await tx.corporationDetails.create({
                data: {
                  organizationId: org.id,
                  ...data
                }
              });
            }
          }
          break;

        case "cso":
          if (csoDetails) {
            const existing = await tx.csoDetails.findUnique({
              where: { organizationId: org.id }
            });

            const data = {
              agencyName: csoDetails.agencyName,
              agencyCode: csoDetails.agencyCode,
              registrationNo: csoDetails.registrationNo,
              tpn: csoDetails.tpn,
              taxpayerRegistrationRegion: csoDetails.taxpayerRegistrationRegion || taxpayerRegistrationRegion,
              registrationType: csoDetails.registrationType || registrationType,
              contactPerson: csoDetails.contactPerson || contactPerson,
              contactEmail: csoDetails.contactEmail || contactEmail,
              contactPhone: csoDetails.contactPhone || contactPhone
            };

            if (existing) {
              details = await tx.csoDetails.update({
                where: { organizationId: org.id },
                data
              });
            } else {
              details = await tx.csoDetails.create({
                data: {
                  organizationId: org.id,
                  ...data
                }
              });
            }
          }
          break;
      }

      return { ...org, details };
    });

    return Response.json({ success: true, organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}