// /api/party/update/route.js
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
      partyId,
      status,
      // Common fields
      taxPayerRegStatus,
      taxPayerRegNo,
      taxPayerRegion,
      address,
      officeEmail,
      officePhone,
      contactName,
      contactEmail,
      contactPhone,
      phone,
      email,
      // Type-specific fields
      ...typeSpecificData
    } = body;

    if (!partyId) {
      return Response.json({ error: "Party ID is required" }, { status: 400 });
    }

    // Check if party exists and is not deleted
    const existingParty = await prisma.party.findUnique({
      where: { 
        partyId: parseInt(partyId),
        isDeleted: 0 
      }
    });

    if (!existingParty) {
      return Response.json({ error: "Party not found" }, { status: 404 });
    }

    // Update base party record
    const updatedParty = await prisma.party.update({
      where: { partyId: parseInt(partyId) },
      data: {
        status: status || existingParty.status,
        updatedAt: new Date()
      }
    });

    // Update type-specific record
    let updatedTypeSpecific = null;
    const updateData = {};

    // Add common fields if provided
    if (taxPayerRegStatus !== undefined) updateData.taxPayerRegStatus = taxPayerRegStatus;
    if (taxPayerRegNo !== undefined) updateData.taxPayerRegNo = taxPayerRegNo;
    if (taxPayerRegion !== undefined) updateData.taxPayerRegion = taxPayerRegion;
    if (address !== undefined) updateData.address = address;
    if (officeEmail !== undefined) updateData.officeEmail = officeEmail;
    if (officePhone !== undefined) updateData.officePhone = officePhone;

    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    
    // Add type-specific fields and contact info
    switch (existingParty.partyType) {
      case 'BUSINESS':
        if (typeSpecificData.licenseNo !== undefined) updateData.licenseNo = typeSpecificData.licenseNo;
        if (typeSpecificData.companyRegistrationNo !== undefined) updateData.companyRegistrationNo = typeSpecificData.companyRegistrationNo;
        if (typeSpecificData.businessName !== undefined) updateData.businessName = typeSpecificData.businessName;
        if (typeSpecificData.businessLicenseRegion !== undefined) updateData.businessLicenseRegion = typeSpecificData.businessLicenseRegion;
        if (contactName !== undefined) updateData.representativeName = contactName;
        if (contactEmail !== undefined) updateData.representativeEmail = contactEmail;
        if (contactPhone !== undefined) updateData.representativePhone = contactPhone;
        break;
        
      case 'GOVERNMENT_AGENCY':
        if (typeSpecificData.agencyName !== undefined) updateData.agencyName = typeSpecificData.agencyName;
        if (contactName !== undefined) updateData.contactName = contactName;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        break;
        
      case 'CORPORATION':
        if (typeSpecificData.corporationName !== undefined) updateData.corporationName = typeSpecificData.corporationName;
        if (contactName !== undefined) updateData.contactName = contactName;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        break;
        
      case 'CSO':
        if (typeSpecificData.csoRegistrationNo !== undefined) updateData.csoRegistrationNo = typeSpecificData.csoRegistrationNo;
        if (contactName !== undefined) updateData.contactName = contactName;
        if (typeSpecificData.csoName !== undefined) updateData.csoName = typeSpecificData.csoName;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        break;
        
      case 'INDIVIDUAL':
        if (typeSpecificData.cid !== undefined) updateData.cid = typeSpecificData.cid;
        if (typeSpecificData.name !== undefined) updateData.name = typeSpecificData.name;
        if (email !== undefined ) updateData.email = email;
        if (phone !== undefined ) updateData.phone = phone;
        break;
    }

    // Perform the update if there's data to update
    if (Object.keys(updateData).length > 0) {
      switch (existingParty.partyType) {
        case 'BUSINESS':
          updatedTypeSpecific = await prisma.BusinessParty.update({
            where: { partyId: parseInt(partyId) },
            data: updateData
          });
          break;
        case 'GOVERNMENT_AGENCY':
          updatedTypeSpecific = await prisma.GovernmentAgencyParty.update({
            where: { partyId: parseInt(partyId) },
            data: updateData
          });
          break;
        case 'CORPORATION':
          updatedTypeSpecific = await prisma.CorporationParty.update({
            where: { partyId: parseInt(partyId) },
            data: updateData
          });
          break;
        case 'CSO':
          updatedTypeSpecific = await prisma.CSOParty.update({
            where: { partyId: parseInt(partyId) },
            data: updateData
          });
          break;
        case 'INDIVIDUAL':
          updatedTypeSpecific = await prisma.IndividualParty.update({
            where: { partyId: parseInt(partyId) },
            data: updateData
          });
          break;
      }
    }

    return Response.json({ 
      success: true, 
      message: "Party updated successfully",
      party: updatedParty,
      details: updatedTypeSpecific
    });
  } catch (error) {
    console.error("Update party error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}