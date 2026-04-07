import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return Response.json({ error: "Invalid party ID" }, { status: 400 });
    }

    // Get base party information
    const party = await prisma.party.findUnique({
      where: { 
        partyId: id,
        isDeleted: 0 
      }
    });

    if (!party) {
      return Response.json({ error: "Party not found" }, { status: 404 });
    }

    // Get type-specific data based on partyType
    let typeSpecificData = null;
    let queryOptions = {
      where: { partyId: id }
    };

    switch (party.partyType) {
      case 'BUSINESS':
        typeSpecificData = await prisma.BusinessParty.findUnique(queryOptions);
        break;
      case 'GOVERNMENT_AGENCY':
        typeSpecificData = await prisma.GovernmentAgencyParty.findUnique(queryOptions);
        break;
      case 'CORPORATION':
        typeSpecificData = await prisma.CorporationParty.findUnique(queryOptions);
        break;
      case 'CSO':
        typeSpecificData = await prisma.CSOParty.findUnique(queryOptions);
        break;
      case 'INDIVIDUAL':
        typeSpecificData = await prisma.IndividualParty.findUnique(queryOptions);
        break;
    }

    return Response.json({ 
      success: true, 
      party: {
        ...party,
        details: typeSpecificData
      }
    });
  } catch (error) {
    console.error("Get party error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}