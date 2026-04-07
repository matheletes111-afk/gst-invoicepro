import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const adjustment_id = parseInt(params.id);

    if (!adjustment_id) {
      return Response.json(
        { success: false, error: "Invalid adjustment ID" },
        { status: 400 }
      );
    }

    const adjustment = await prisma.adjustment.findFirst({
      where: {
        adjustment_id,
        status: { not: "D" },
        organization_id: organizationId // Filter by user's organization
      },
      include: {
        // CUSTOMER (ALL PARTY TYPES)
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true
          }
        },
       

        // INVOICE
        invoice: {
          include: {
            currency_info:true
          }
        },

        // ADJUSTMENT ITEMS
        adjustmentItems: {
          include: {
            goods: true,
            service: true,
            unitObject: true
          }
        }
      }
    });

    if (!adjustment) {
      return Response.json(
        { success: false, error: "Adjustment not found" },
        { status: 404 }
      );
    }

    // Verify that the adjustment belongs to user's organization (double-check)
    if (adjustment.organization_id !== organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: You don't have access to this adjustment record"
      }, { status: 403 });
    }

    /* ================= TRANSFORM FOR EDIT ================= */

    const items = adjustment.adjustmentItems.map(item => ({
      adjustment_item_id: item.adjustment_item_id,
      sales_item_type: item.sales_item_type,

      goods_id: item.goods_id,
      service_id: item.service_id,

      goods_service_name: item.goods_service_name,
      goods_service_description: item.goods_service_description,

      unit_of_measurement_id: item.unit_of_measurement_id,
      unit_name: item.unitObject?.name || "",

      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      amount: Number(item.amount),
      discount: Number(item.discount),
      amount_after_discount: Number(item.amount_after_discount),

      gst_percentage: item.gst_percentage,
      gst_amount: Number(item.gst_amount),

      goods_service_total_amount: Number(item.goods_service_total_amount),

      adjustment_type: item.adjustment_type,
      adjustment_amount: Number(item.adjustment_amount),
      reason_for_adjustment: item.reason_for_adjustment
    }));

    /* ================= FINAL RESPONSE ================= */

    return Response.json({
      success: true,
      data: {
        // BASIC INFO
        adjustment_id: adjustment.adjustment_id,
        adjustment_note_no: adjustment.adjustment_note_no,
        date: adjustment.date.toISOString().split("T")[0],
        status: adjustment.status,

        // CUSTOMER
        customer_id: adjustment.customer_id,
        customer: adjustment.customer,

        // INVOICE
        sale_id: adjustment.sale_id,
        invoice_no: adjustment.invoice_no,
        invoice: adjustment.invoice,

        // AMOUNTS
        sales_amount: Number(adjustment.sales_amount),
        exempt_amount: Number(adjustment.exempt_amount),
        taxable_amount: Number(adjustment.taxable_amount),
        gst_amount: Number(adjustment.gst_amount),
        total_invoice_amount: Number(adjustment.total_invoice_amount),
        total_adjustment_amount: Number(adjustment.total_adjustment_amount),
        effect_on_gst_payable: Number(adjustment.effect_on_gst_payable),
        remark: adjustment.remark,
        adjustment_amount: Number(adjustment.adjustment_amount),
        adjustment_type: adjustment.adjustment_type,


        // ITEMS (FOR EDIT FORM)
        items
      }
    });

  } catch (error) {
    console.error("Adjustment details error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
