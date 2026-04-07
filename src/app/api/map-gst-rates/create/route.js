import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    const { type, serviceGoodsId, serviceGoodsIds, slabId, gstStatus, rateId, minimumValue, remarks, status } = body;

    // Support both single (serviceGoodsId) and multiple (serviceGoodsIds)
    const idsToCreate = Array.isArray(serviceGoodsIds) && serviceGoodsIds.length > 0
      ? serviceGoodsIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id))
      : serviceGoodsId != null && serviceGoodsId !== ""
        ? [parseInt(serviceGoodsId, 10)]
        : [];

    if (!type || idsToCreate.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Type and at least one Service/Goods ID are required.",
        }),
        { status: 400 }
      );
    }

    // Verify slab exists if provided
    if (slabId) {
      const slab = await prisma.GstSlab.findUnique({
        where: { slabId: parseInt(slabId) },
      });
      if (!slab) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "GST Slab not found.",
          }),
          { status: 404 }
        );
      }
    }

    // Verify rate exists if provided
    if (rateId) {
      const rate = await prisma.GstRate.findUnique({
        where: { rateId: parseInt(rateId) },
      });
      if (!rate) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "GST Rate not found.",
          }),
          { status: 404 }
        );
      }
    }

    // Get already-mapped IDs for this type (to avoid duplicates)
    const existing = await prisma.MapGstRates.findMany({
      where: {
        type,
        serviceGoodsId: { in: idsToCreate },
        status: { not: "D" },
      },
      select: { serviceGoodsId: true },
    });
    const existingIds = new Set(existing.map((e) => e.serviceGoodsId));
    const idsToInsert = idsToCreate.filter((id) => !existingIds.has(id));

    if (idsToInsert.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "All selected items already have a GST mapping.",
        }),
        { status: 400 }
      );
    }

    // Verify each goods/service exists
    if (type === "GOODS") {
      for (const id of idsToInsert) {
        const goods = await prisma.GoodsCatalog.findUnique({
          where: { goodsId: id },
        });
        if (!goods) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Goods not found: ${id}.`,
            }),
            { status: 404 }
          );
        }
      }
    } else if (type === "SERVICE") {
      for (const id of idsToInsert) {
        const service = await prisma.ServiceCatalog.findUnique({
          where: { service_id: id },
        });
        if (!service) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Service not found: ${id}.`,
            }),
            { status: 404 }
          );
        }
      }
    }

    const payload = {
      type,
      slabId: slabId ? parseInt(slabId) : null,
      gstStatus: gstStatus || "APPLICABLE",
      rateId: rateId ? parseInt(rateId) : null,
      minimumValue: minimumValue != null && minimumValue !== "" ? parseFloat(minimumValue) : null,
      remarks: remarks ?? null,
      status: status ?? "A",
    };

    const created = await prisma.$transaction(
      idsToInsert.map((serviceGoodsId) =>
        prisma.MapGstRates.create({
          data: {
            ...payload,
            serviceGoodsId,
          },
        })
      )
    );

    try {
      const user = await getUserFromRequest(req);
      if (user?.id) {
        const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";
        const url = req.url || "";
        const pathname = url ? new URL(url).pathname : "unknown";

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "CREATE",
            module: pathname.split("/")[2] || "unknown",
            description: `POST ${pathname}`,
            ipAddress,
            userAgent,
            payload: created,
          },
        });
      }
    } catch (logError) {
      console.error("Activity logging failed:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          created.length === 1
            ? "GST Rate mapping created successfully"
            : `${created.length} GST Rate mappings created successfully`,
        count: created.length,
        mappings: created,
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
