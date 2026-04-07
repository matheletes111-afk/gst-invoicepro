import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { sales_id } = body;

    if (!sales_id) {
      return Response.json(
        { success: false, message: "sales_id is required" },
        { status: 400 }
      );
    }

    // fetch sales
    const sales = await prisma.sales.findUnique({
      where: { sales_id },
    });

    if (!sales) {
      return Response.json(
        { success: false, message: "Sales not found" },
        { status: 404 }
      );
    }

    // check existing invoice (sales_id is NOT unique)
    const existingInvoice = await prisma.gstInvoiceOriginal.findFirst({
      where: { sales_id },
    });

    let invoice;

    if (existingInvoice) {
      // 🔁 UPDATE
      invoice = await prisma.gstInvoiceOriginal.update({
        where: {
          gst_invoice_id: existingInvoice.gst_invoice_id, // ✅ UNIQUE
        },
        data: {
          organization_id: sales.organization_id,
          customer_id: sales.customer_id,
          gst_invoice_date: sales.sales_date,

          total_sales_amount: sales.sales_amount,
          total_exempt_amount: sales.exempt_amount,
          total_taxable_amount: sales.taxable_amount,
          total_gst_amount: sales.gst_amount,
          total_invoice_amount: sales.total_invoice_amount,
          gst_invoice_no: sales.sales_invoice_no,
          updated_at: new Date(),
        },
      });
    } else {
      // ➕ CREATE
      invoice = await prisma.gstInvoiceOriginal.create({
        data: {
          organization_id: sales.organization_id,
          sales_id: sales.sales_id,
          customer_id: sales.customer_id,
          gst_invoice_date: sales.sales_date,

          total_sales_amount: sales.sales_amount,
          total_exempt_amount: sales.exempt_amount,
          total_taxable_amount: sales.taxable_amount,
          total_gst_amount: sales.gst_amount,
          total_invoice_amount: sales.total_invoice_amount,
          gst_invoice_no: sales.sales_invoice_no,
          created_by: sales.created_by,
        },
      });
    }

    return Response.json({
      success: true,
      message: existingInvoice
        ? "Invoice updated successfully"
        : "Invoice created successfully",
      invoice,
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
