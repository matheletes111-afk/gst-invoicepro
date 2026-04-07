import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({ 
        error: "Unauthorized: Organization ID not found in token" 
      }, { status: 401 });
    }

    const invoice = await prisma.secondHandGoodsSalesInvoice.findUnique({
      where: { invoiceId: Number(params.id) },
      include: {
        organization: {
          include: {
            businessDetails: true
          }
        },
        party: {
          include: {
            businessParty: true,
            individualParty: true
          }
        },
        currency: {
          select: {
            currencyId: true,
            currencyName: true,
            currencySymbol: true
          }
        },
        items: {
          where: { status: { not: "D" } },
          include: {
            unit: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!invoice || invoice.status === "D") {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify that the invoice belongs to user's organization
    if (invoice.organizationId !== organizationId) {
      return Response.json({ 
        error: "Unauthorized: You don't have access to this invoice" 
      }, { status: 403 });
    }

    return Response.json({ success: true, invoice });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

