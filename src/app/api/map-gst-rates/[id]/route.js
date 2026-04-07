import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const organizationId = await getOrganizationIdFromRequest(req);
    if (!organizationId) {
      return Response.json(
        { error: "Unauthorized: Organization ID not found in token" },
        { status: 401 }
      );
    }

    const mapping = await prisma.MapGstRates.findUnique({
      where: { mappingId: Number(params.id) },
      include: {
        slab: {
          select: {
            slabId: true,
            slabName: true
          }
        },
        rate: {
          select: {
            rateId: true,
            gstRate: true
          }
        }
      }
    });

    // If not found OR marked as Deleted → treat as not found
    if (!mapping || mapping.status === "D") {
      return Response.json({ error: "Mapping not found" }, { status: 404 });
    }

    // Fetch goods/service name based on type
    let serviceGoodsName = null;
    if (mapping.type === "GOODS") {
      const goods = await prisma.GoodsCatalog.findUnique({
        where: { goodsId: mapping.serviceGoodsId },
        select: { goodsName: true, goodsCode: true, organizationId: true }
      });
      if (!goods || goods.organizationId !== organizationId) {
        return Response.json({ error: "Mapping not found" }, { status: 404 });
      }
      serviceGoodsName = `${goods.goodsName} (${goods.goodsCode})`;
    } else if (mapping.type === "SERVICE") {
      const service = await prisma.ServiceCatalog.findUnique({
        where: { service_id: mapping.serviceGoodsId },
        select: { service_name: true, service_code: true, organizationId: true }
      });
      if (!service || service.organizationId !== organizationId) {
        return Response.json({ error: "Mapping not found" }, { status: 404 });
      }
      serviceGoodsName = `${service.service_name} (${service.service_code})`;
    }

    return Response.json({ 
      success: true, 
      mapping: { ...mapping, serviceGoodsName }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

