import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - Top Customers and Products Report
export async function GET(req) {
  try {
    // Get organizationId from JWT token
    const organizationId = await getOrganizationIdFromRequest(req);
    
    if (!organizationId) {
      return Response.json({
        success: false,
        error: "Unauthorized: Organization ID not found in token"
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Required filters
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const exportExcel = searchParams.get("export") === "excel";
    const limit = parseInt(searchParams.get("limit")) || 10;
    const reportType = searchParams.get("type") || "customers"; // customers or products

    // Check if date range is provided
    if (!fromDate || !toDate) {
      return Response.json({
        success: true,
        data: {
          topCustomers: [],
          topProductsByValue: [],
          topProductsByQuantity: []
        },
        summary: null,
        message: "Please select a date range to view top performers"
      });
    }

    // Build where clause
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId,
      sales_date: {
        gte: new Date(fromDate + "T00:00:00"),
        lte: new Date(toDate + "T23:59:59")
      }
    };

    // Get sales for the period
    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: {
          include: {
            businessParty: true,
            governmentAgencyParty: true,
            corporationParty: true,
            csoParty: true,
            individualParty: true,
          }
        },
        items: {
          include: {
            goods: true,
            service: true,
            unitObject: true
          }
        }
      },
      orderBy: { sales_date: 'desc' }
    });

    // Calculate total period sales for percentage calculation
    const totalPeriodSales = sales.reduce((sum, sale) => 
      sum + Number(sale.total_invoice_amount), 0
    );

    // 1. Top Customers by Value
    const customerMap = new Map();
    
    sales.forEach(sale => {
      const customerId = sale.customer_id;
      
      if (!customerMap.has(customerId)) {
        // Get customer info
        const customerInfo = getCustomerInfo(sale.customer);
        
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: customerInfo.name || "Unknown",
          tpn: customerInfo.tpn || "-",
          email: customerInfo.email,
          phone: customerInfo.phone,
          invoice_count: 0,
          total_sales_value: 0,
          items_purchased: 0
        });
      }

      const customerData = customerMap.get(customerId);
      customerData.invoice_count += 1;
      customerData.total_sales_value += Number(sale.total_invoice_amount);
      customerData.items_purchased += sale.items.length;
    });

    // Convert to array and calculate percentage
    let topCustomers = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      total_sales_value: Number(customer.total_sales_value.toFixed(2)),
      contribution_percentage: totalPeriodSales > 0 
        ? Number(((customer.total_sales_value / totalPeriodSales) * 100).toFixed(2))
        : 0
    }));

    // Sort by total sales value (descending)
    topCustomers.sort((a, b) => b.total_sales_value - a.total_sales_value);
    
    // Take top N customers
    topCustomers = topCustomers.slice(0, limit);

    // 2. Top Products by Sales Value and Quantity
    const productValueMap = new Map();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productKey = item.goods_id || item.service_id;
        const productName = item.goods?.goodsName || item.service?.serviceName || item.goods_service_name || "Unknown";
        const productType = item.sales_item_type === 'GOODS' ? 'Goods' : 'Service';
        const unitPrice = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 0);
        const itemValue = Number(item.amount_after_discount || 0) + Number(item.gst_amount || 0);
        
        if (!productValueMap.has(productKey)) {
          productValueMap.set(productKey, {
            product_id: productKey,
            product_name: productName,
            product_type: productType,
            total_quantity: 0,
            total_sales_value: 0,
            total_gst_amount: 0,
            total_unit_price_sum: 0,
            total_items_count: 0  // To calculate average properly
          });
        }

        const productData = productValueMap.get(productKey);
        productData.total_quantity += quantity;
        productData.total_sales_value += itemValue;
        productData.total_gst_amount += Number(item.gst_amount || 0);
        productData.total_unit_price_sum += unitPrice * quantity; // Weighted sum for average
        productData.total_items_count += quantity;
      });
    });

    // Calculate average unit price for all products
    let allProducts = Array.from(productValueMap.values()).map(product => {
      const avgPrice = product.total_items_count > 0 
        ? product.total_unit_price_sum / product.total_items_count
        : 0;
      
      return {
        ...product,
        total_sales_value: Number(product.total_sales_value.toFixed(2)),
        total_gst_amount: Number(product.total_gst_amount.toFixed(2)),
        unit_price_avg: Number(avgPrice.toFixed(2)),
        contribution_percentage: totalPeriodSales > 0 
          ? Number(((product.total_sales_value / totalPeriodSales) * 100).toFixed(2))
          : 0
      };
    });

    // Sort by total sales value (descending) for value-based ranking
    let topProductsByValue = [...allProducts].sort((a, b) => b.total_sales_value - a.total_sales_value);
    topProductsByValue = topProductsByValue.slice(0, limit);

    // Sort by quantity (descending) for quantity-based ranking
    let topProductsByQuantity = [...allProducts].sort((a, b) => b.total_quantity - a.total_quantity);
    topProductsByQuantity = topProductsByQuantity.slice(0, limit);

    // Calculate summary
    const summary = {
      period_total_sales: Number(totalPeriodSales.toFixed(2)),
      total_customers: customerMap.size,
      total_products: productValueMap.size,
      top_customer_percentage: topCustomers.length > 0 
        ? topCustomers.reduce((sum, cust) => sum + cust.contribution_percentage, 0).toFixed(2)
        : "0.00",
      top_product_percentage: topProductsByValue.length > 0 
        ? topProductsByValue.reduce((sum, prod) => sum + prod.contribution_percentage, 0).toFixed(2)
        : "0.00"
    };

    // Return specific data based on report type
    let responseData = {};
    if (reportType === "customers") {
      responseData = { topCustomers };
    } else if (reportType === "products") {
      responseData = { topProductsByValue, topProductsByQuantity };
    } else {
      responseData = { topCustomers, topProductsByValue, topProductsByQuantity };
    }

    // Export to CSV if requested
    if (exportExcel) {
      return generateCSVReport(
        { topCustomers, topProductsByValue, topProductsByQuantity },
        summary,
        fromDate,
        toDate,
        reportType
      );
    }

    return Response.json({
      success: true,
      data: responseData,
      summary,
      period: {
        from_date: fromDate,
        to_date: toDate
      }
    });

  } catch (error) {
    console.error("Error generating top performers report:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to get customer info
function getCustomerInfo(customer) {
  if (!customer) return {};

  switch (customer.partyType) {
    case "BUSINESS":
      return {
        name: customer.businessParty?.businessName,
        tpn: customer.businessParty?.taxPayerRegNo,
        email: customer.businessParty?.officeEmail,
        phone: customer.businessParty?.officePhone,
        address: customer.businessParty?.address,
      };

    case "GOVERNMENT_AGENCY":
      return {
        name: customer.governmentAgencyParty?.agencyName,
        tpn: customer.governmentAgencyParty?.taxPayerRegNo,
        email: customer.governmentAgencyParty?.officeEmail,
        phone: customer.governmentAgencyParty?.officePhone,
        address: customer.governmentAgencyParty?.address,
      };

    case "CORPORATION":
      return {
        name: customer.corporationParty?.corporationName,
        tpn: customer.corporationParty?.taxPayerRegNo,
        email: customer.corporationParty?.officeEmail,
        phone: customer.corporationParty?.officePhone,
        address: customer.corporationParty?.address,
      };

    case "CSO":
      return {
        name: customer.csoParty?.agencyName,
        tpn: customer.csoParty?.taxPayerRegNo,
        email: customer.csoParty?.officeEmail,
        phone: customer.csoParty?.officePhone,
        address: customer.csoParty?.address,
      };

    case "INDIVIDUAL":
      return {
        name: customer.individualParty?.name,
        tpn: customer.individualParty?.cid,
        email: customer.individualParty?.email,
        phone: customer.individualParty?.phone,
        address: customer.individualParty?.address,
      };

    default:
      return {};
  }
}

// Helper function to generate CSV report
function generateCSVReport(data, summary, fromDate, toDate, reportType) {
  const { topCustomers, topProductsByValue, topProductsByQuantity } = data;
  
  // Create report info
  const reportInfo = [
    'Top Performing Report',
    '',
    `Period: ${fromDate} to ${toDate}`,
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
  ];

  // Add summary
  reportInfo.push('SUMMARY');
  reportInfo.push(`Period: ${fromDate} to ${toDate}`);
  reportInfo.push(`Total Sales for Period: ${summary.period_total_sales}`);
  reportInfo.push(`Total Unique Customers: ${summary.total_customers}`);
  reportInfo.push(`Total Unique Products: ${summary.total_products}`);
  reportInfo.push(`Top Customers Contribution: ${summary.top_customer_percentage}%`);
  reportInfo.push(`Top Products Contribution: ${summary.top_product_percentage}%`);
  reportInfo.push('');

  let csvContent = reportInfo.join('\n');

  // Add top customers section
  if (topCustomers.length > 0 && (reportType === 'customers' || reportType === 'all')) {
    const customerHeaders = [
      'Rank',
      'Customer Name',
      'TPN',
      'Email',
      'Phone',
      'Invoice Count',
      'Total Sales Value',
      'Contribution %'
    ];

    const customerRows = topCustomers.map((customer, index) => [
      index + 1,
      `"${(customer.customer_name || '').replace(/"/g, '""')}"`,
      customer.tpn || '-',
      customer.email || '-',
      customer.phone || '-',
      customer.invoice_count,
      customer.total_sales_value,
      customer.contribution_percentage
    ]);

    csvContent += '\nTOP 10 CUSTOMERS BY VALUE\n\n';
    csvContent += customerHeaders.join(',') + '\n';
    csvContent += customerRows.map(row => row.join(',')).join('\n') + '\n\n';
  }

  // Add top products by value section
  if (topProductsByValue.length > 0 && (reportType === 'products' || reportType === 'all')) {
    const productHeaders = [
      'Rank',
      'Product Name',
      'Product Type',
      'Total Quantity',
      'Total Sales Value',
      'Total GST Amount',
      'Avg Unit Price',
      'Contribution %'
    ];

    const productRows = topProductsByValue.map((product, index) => [
      index + 1,
      `"${(product.product_name || '').replace(/"/g, '""')}"`,
      product.product_type,
      product.total_quantity,
      product.total_sales_value,
      product.total_gst_amount,
      product.unit_price_avg,
      product.contribution_percentage
    ]);

    csvContent += '\nTOP 10 PRODUCTS BY SALES VALUE\n\n';
    csvContent += productHeaders.join(',') + '\n';
    csvContent += productRows.map(row => row.join(',')).join('\n') + '\n\n';
  }

  // Add top products by quantity section
  if (topProductsByQuantity.length > 0 && (reportType === 'products' || reportType === 'all')) {
    const quantityHeaders = [
      'Rank',
      'Product Name',
      'Product Type',
      'Total Quantity',
      'Total Sales Value',
      'Avg Unit Price',
      'Contribution %'
    ];

    const quantityRows = topProductsByQuantity.map((product, index) => [
      index + 1,
      `"${(product.product_name || '').replace(/"/g, '""')}"`,
      product.product_type,
      product.total_quantity,
      product.total_sales_value,
      product.unit_price_avg,
      product.contribution_percentage
    ]);

    csvContent += '\nTOP 10 PRODUCTS BY QUANTITY\n\n';
    csvContent += quantityHeaders.join(',') + '\n';
    csvContent += quantityRows.map(row => row.join(',')).join('\n');
  }

  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `top-performing-report-${fromDate}-to-${toDate}.csv`;
  
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}