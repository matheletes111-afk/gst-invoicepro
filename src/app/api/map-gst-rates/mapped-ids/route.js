import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

/**
 * GET /api/map-gst-rates/mapped-ids?type=GOODS|SERVICE
 * Returns IDs of goods or services that already have a GST mapping (status not D).
 * Used on create page to exclude already-mapped items from dropdown.
 */
export async function GET(req) {
  try {
    const organizationId = await getOrganizationIdFromRequest(req);
    if (!organizationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Organization ID not found in token",
        }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // GOODS or SERVICE

    if (!type || !["GOODS", "SERVICE"].includes(type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Query param 'type' is required and must be GOODS or SERVICE.",
        }),
        { status: 400 }
      );
    }

    const catalogIds =
      type === "GOODS"
        ? (
            await prisma.GoodsCatalog.findMany({
              where: { organizationId, status: { not: "D" } },
              select: { goodsId: true },
            })
          ).map((g) => g.goodsId)
        : (
            await prisma.ServiceCatalog.findMany({
              where: { organizationId, status: { not: "D" } },
              select: { service_id: true },
            })
          ).map((s) => s.service_id);

    const mappings = await prisma.MapGstRates.findMany({
      where: {
        type,
        status: { not: "D" },
        serviceGoodsId: { in: catalogIds },
      },
      select: { serviceGoodsId: true },
    });

    const mappedIds = [...new Set(mappings.map((m) => m.serviceGoodsId))];

    return new Response(
      JSON.stringify({
        success: true,
        type,
        mappedIds,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
