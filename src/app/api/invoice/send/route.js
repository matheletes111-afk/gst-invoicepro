import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { generateInvoiceHTML, parseAddressFromJson, formatDate } from "@/lib/pdf-generator";
import puppeteer from "puppeteer";

async function generatePDF(html, salesId) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for any fonts or images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    // Create invoices directory if it doesn't exist
    const invoiceDir = path.join(process.cwd(), 'public/invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    
    // Save PDF to file
    const pdfPath = path.join(invoiceDir, `invoice_${salesId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    return pdfPath;
  } finally {
    await browser.close();
  }
}

async function fetchSalesData(salesId) {
  /* ---------------- SALES ---------------- */
  const salesResult = await prisma.$queryRaw`
    SELECT 
      s.sales_id,
      s.organization_id,
      s.customer_id,
      s.currency,
      c.currencyName,
      c.currencySymbol,
      s.customer_tpn,
      s.customer_name,
      s.sales_date,
      s.sales_amount,
      s.exempt_amount,
      s.taxable_amount,
      s.sales_invoice_no,
      s.gst_amount,
      s.total_invoice_amount,
      s.status,
      s.created_by,
      s.created_on,
      s.payment_mode,
      s.transaction_id,
      s.journal_number,
      s.cheque_number,
      s.bank_name


    FROM tbl_sales AS s
    LEFT JOIN Currency AS c ON s.currency = c.currencyId
    WHERE s.sales_id = ${salesId}
    LIMIT 1
  `;

  if (!salesResult.length) {
    throw new Error("Sales not found");
  }

  const sales = salesResult[0];

  /* ---------------- PARTY ---------------- */
  const partyResult = await prisma.$queryRaw`
    SELECT *
    FROM Party
    WHERE partyId = ${sales.customer_id}
    LIMIT 1
  `;

  if (!partyResult.length) {
    throw new Error("Party not found");
  }

  const party = partyResult[0];

  /* ---------------- PARTY DETAILS BY TYPE ---------------- */
  let partyDetails = {};
  let partyDisplayName = "";
  let partyEmail = "";
  let partyPhone = "";
  let partyAddress = "";
  let partyRegistrationNo = "";

  switch (party.partyType) {
    case "BUSINESS":
      partyDetails = (
        await prisma.$queryRaw`
          SELECT * FROM BusinessParty WHERE partyId = ${party.partyId} LIMIT 1
        `
      )[0];
      partyDisplayName = partyDetails?.businessName || sales.customer_name || "Business";
      partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
      partyEmail = partyDetails?.officeEmail || "";
      partyPhone = partyDetails?.officePhone || "";
      partyAddress = partyDetails?.address || "";
      break;

    case "GOVERNMENT_AGENCY":
      partyDetails = (
        await prisma.$queryRaw`
          SELECT * FROM GovernmentAgencyParty WHERE partyId = ${party.partyId} LIMIT 1
        `
      )[0];
      partyDisplayName = partyDetails?.agencyName || "Government Agency";
      partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
      partyEmail = partyDetails?.officeEmail || "";
      partyPhone = partyDetails?.officePhone || "";
      partyAddress = partyDetails?.address || "";
      break;

    case "CORPORATION":
      partyDetails = (
        await prisma.$queryRaw`
          SELECT * FROM CorporationParty WHERE partyId = ${party.partyId} LIMIT 1
        `
      )[0];
      partyDisplayName = partyDetails?.corporationName || sales.customer_name || "Corporation";
      partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
      partyEmail = partyDetails?.officeEmail || "";
      partyPhone = partyDetails?.officePhone || "";
      partyAddress = partyDetails?.address || "";
      break;

    case "CSO":
      partyDetails = (
        await prisma.$queryRaw`
          SELECT * FROM CSOParty WHERE partyId = ${party.partyId} LIMIT 1
        `
      )[0];
      partyDisplayName = partyDetails?.csoName || sales.customer_name || "CSO";
      partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
      partyEmail = partyDetails?.officeEmail || "";
      partyPhone = partyDetails?.officePhone || "";
      partyAddress = partyDetails?.address || "";
      break;

    case "INDIVIDUAL":
      partyDetails = (
        await prisma.$queryRaw`
          SELECT * FROM IndividualParty WHERE partyId = ${party.partyId} LIMIT 1
        `
      )[0];
      partyDisplayName = sales.customer_name || "Individual";
      partyRegistrationNo = partyDetails?.taxPayerRegNo || "";
      partyEmail = partyDetails?.email || "";
      partyPhone = partyDetails?.phone || "";
      partyAddress = partyDetails?.address || "";
      break;
  }

  /* ---------------- ORGANIZATION ---------------- */
  const orgResult = await prisma.$queryRaw`
    SELECT *
    FROM Organization
    WHERE id = ${sales.organization_id}
    LIMIT 1
  `;

  if (!orgResult.length) {
    throw new Error("Organization not found");
  }

  const org = orgResult[0];

  /* ---------------- ORGANIZATION DETAILS ---------------- */
  let orgDetails = {};
  let orgName = '';
  let orgCode = '';
  let orgAddress = '';
  let orgPhone = '';
  let orgEmail = '';

  switch (org.orgType) {
    case 'business':
      orgDetails = (
        await prisma.$queryRaw`
          SELECT * FROM BusinessDetails
          WHERE organizationId = ${org.id}
          LIMIT 1
        `
      )[0];
      orgName = orgDetails?.businessName || '';
      orgCode = orgDetails?.businessNameCode || '';
      orgAddress = parseAddressFromJson(orgDetails?.officeLocationJson);
      orgPhone = orgDetails?.officePhone || '';
      orgEmail = orgDetails?.officeEmail || '';
      break;

    case 'government':
      orgDetails = (
        await prisma.$queryRaw`
          SELECT * FROM GovernmentAgencyDetails
          WHERE organizationId = ${org.id}
          LIMIT 1
        `
      )[0];
      orgName = orgDetails?.agencyName || '';
      orgCode = orgDetails?.agencyCode || '';
      orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
      orgPhone = orgDetails?.contactPhone || '';
      orgEmail = orgDetails?.contactEmail || '';
      break;

    case 'corporation':
      orgDetails = (
        await prisma.$queryRaw`
          SELECT * FROM CorporationDetails
          WHERE organizationId = ${org.id}
          LIMIT 1
        `
      )[0];
      orgName = orgDetails?.corporationName || '';
      orgCode = orgDetails?.organizationCode || '';
      orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
      orgPhone = orgDetails?.contactPhone || '';
      orgEmail = orgDetails?.contactEmail || '';
      break;

    case 'cso':
      orgDetails = (
        await prisma.$queryRaw`
          SELECT * FROM CsoDetails
          WHERE organizationId = ${org.id}
          LIMIT 1
        `
      )[0];
      orgName = orgDetails?.agencyName || '';
      orgCode = orgDetails?.agencyCode || '';
      orgAddress = orgDetails?.taxpayerRegistrationRegion || '';
      orgPhone = orgDetails?.contactPhone || '';
      break;
  }

  /* ---------------- SALES ITEMS ---------------- */
  const saleItems = await prisma.$queryRaw`
    SELECT
      si.sales_item_id,
      si.sales_id,
      si.sales_item_type,
      si.goods_service_name,
      si.goods_service_description,
      si.unit_price,
      si.quantity,
      si.amount,
      si.unit_of_measurement_id,
      u.name,
      si.discount,
      si.amount_after_discount,
      si.gst_percentage,
      si.gst_amount,
      si.goods_service_total_amount
    FROM tbl_sales_items AS si
    LEFT JOIN Unit AS u ON u.id = si.unit_of_measurement_id
    WHERE si.sales_id = ${sales.sales_id}
  `;

  const gstPercentage = saleItems.length > 0 ? saleItems[0]?.gst_percentage || 5 : 5;

  return {
    sales,
    saleItems,
    party: {
      name: partyDisplayName,
      tpn: partyRegistrationNo,
      address: partyAddress,
      email: partyEmail,
      phone: partyPhone
    },
    organization: {
      name: orgName,
      tpn: orgCode,
      address: orgAddress,
      phone: orgPhone,
      email: orgEmail
    },
    gstPercentage
  };
}

async function sendEmail(pdfPath, partyEmail, isOriginal, salesId) {
  const subject = isOriginal ? "Original Invoice" : "Copy Invoice";
  const mailText = isOriginal 
    ? "Please find attached the original invoice."
    : "Please find attached the copy of the invoice.";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Invoice" <${process.env.SMTP_USER}>`,
    to: partyEmail,
    subject,
    text: mailText,
    attachments: [
      {
        filename: `invoice_${salesId}.pdf`,
        path: pdfPath,
      },
    ],
  });
}

export async function POST(req) {
  try {
    const { sales_id } = await req.json();

    // Fetch sales data
    const { sales, saleItems, party, organization, gstPercentage } = await fetchSalesData(sales_id);

    // Check if email exists
    if (!party.email) {
      return NextResponse.json({ message: "Customer email not found" }, { status: 400 });
    }

    /* ---------------- ORIGINAL / COPY LOGIC ---------------- */
    const salesRecord = await prisma.sales.findUnique({
      where: { sales_id: sales_id }
    });

    if (!salesRecord) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    const isOriginal = salesRecord.emailOriginalInvoiceSent === "Y";

    /* ---------------- GENERATE HTML ---------------- */
    const html = generateInvoiceHTML({
      salesId: sales_id,
      sales,
      items: saleItems,
      party,
      organization,
      gstPercentage,
      emailOriginalInvoiceSent:salesRecord.emailOriginalInvoiceSent,
    });

    /* ---------------- GENERATE PDF ---------------- */
    const pdfPath = await generatePDF(html, sales_id);

    /* ---------------- SEND EMAIL ---------------- */
    await sendEmail(pdfPath, party.email, isOriginal, sales_id);

    /* ---------------- UPDATE FLAG AFTER FIRST SEND ---------------- */
    if (isOriginal) {
      await prisma.sales.update({
        where: { sales_id: sales_id },
        data: { emailOriginalInvoiceSent: "N" },
      });
    }

    return NextResponse.json({
      success: true,
      type: isOriginal ? "ORIGINAL" : "COPY",
      pdfPath: `/invoices/invoice_${sales_id}.pdf`
    });

  } catch (error) {
    console.error("Error sending invoice:", error);
    
    let status = 500;
    let message = "Failed to send invoice";
    
    if (error.message === "Sales not found") {
      status = 404;
      message = "Sale not found";
    } else if (error.message === "Party not found") {
      status = 404;
      message = "Party not found";
    } else if (error.message === "Organization not found") {
      status = 404;
      message = "Organization not found";
    }
    
    return NextResponse.json({ message, error: error.message }, { status });
  }
}