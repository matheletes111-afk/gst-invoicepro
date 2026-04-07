import prisma from "@/lib/prisma";
import { getOrganizationIdFromRequest } from "@/lib/auth";

// GET - GST Collection Trend Analysis
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
    const periodType = searchParams.get("period_type") || "monthly"; // monthly, quarterly, yearly
    const compareWithPrevious = searchParams.get("compare") === "true";
    const exportExcel = searchParams.get("export") === "excel";

    // Check if date range is provided
    if (!fromDate || !toDate) {
      return Response.json({
        success: true,
        data: {
          gstTrends: [],
          periodComparison: null,
          taxBreakdown: null,
          summary: null
        },
        message: "Please select a date range to view GST trends"
      });
    }

    const startDate = new Date(fromDate + "T00:00:00");
    const endDate = new Date(toDate + "T23:59:59");

    // Build where clause
    let where = {
      status: { not: "D" }, // Exclude deleted
      organization_id: organizationId,
      sales_date: {
        gte: startDate,
        lte: endDate
      },
      gst_amount: { gt: 0 } // Only include sales with GST
    };

    // Get sales data with GST details
    const sales = await prisma.sales.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            goods: {
              include: {
                gstRate: true
              }
            },
            service: {
              include: {
                gstRate: true
              }
            }
          }
        }
      },
      orderBy: { sales_date: 'asc' }
    });

    // Calculate previous period for comparison
    let previousPeriodData = null;
    if (compareWithPrevious) {
      const periodDuration = endDate - startDate;
      const previousStartDate = new Date(startDate.getTime() - periodDuration);
      const previousEndDate = new Date(startDate.getTime() - 1);
      
      const previousSales = await prisma.sales.findMany({
        where: {
          status: { not: "D" },
          organization_id: organizationId,
          sales_date: {
            gte: previousStartDate,
            lte: previousEndDate
          },
          gst_amount: { gt: 0 }
        }
      });
      
      previousPeriodData = previousSales;
    }

    // Helper function to format period key
    const getPeriodKey = (date, type) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const quarter = Math.floor((month - 1) / 3) + 1;
      
      switch (type) {
        case 'yearly':
          return `${year}`;
        case 'quarterly':
          return `Q${quarter} ${year}`;
        case 'monthly':
        default:
          return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
      }
    };

    // Helper function to get period start date
    const getPeriodStartDate = (date, type) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      switch (type) {
        case 'yearly':
          return new Date(year, 0, 1);
        case 'quarterly':
          const quarter = Math.floor(month / 3);
          return new Date(year, quarter * 3, 1);
        case 'monthly':
        default:
          return new Date(year, month, 1);
      }
    };

    // Process current period data
    const gstTrends = new Map();
    const gstRateSummary = new Map(); // Track GST by rate
    const taxTypeBreakdown = {
      goods: { gst: 0, count: 0, taxable: 0 },
      services: { gst: 0, count: 0, taxable: 0 }
    };
    
    let totalGST = 0;
    let totalSalesValue = 0;
    let totalTaxableAmount = 0;
    let totalExemptAmount = 0;
    let invoiceCount = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.sales_date);
      const periodKey = getPeriodKey(saleDate, periodType);
      const periodStart = getPeriodStartDate(saleDate, periodType);
      
      if (!gstTrends.has(periodKey)) {
        gstTrends.set(periodKey, {
          period: periodKey,
          period_start: periodStart,
          total_gst: 0,
          total_sales: 0,
          taxable_amount: 0,
          exempt_amount: 0,
          invoice_count: 0,
          gst_by_rate: new Map(),
          tax_type: {
            goods: { gst: 0, count: 0, taxable: 0 },
            services: { gst: 0, count: 0, taxable: 0 }
          }
        });
      }

      const periodData = gstTrends.get(periodKey);
      const saleGST = Number(sale.gst_amount || 0);
      const saleValue = Number(sale.total_invoice_amount || 0);
      const taxableAmount = Number(sale.taxable_amount || 0);
      const exemptAmount = Number(sale.exempt_amount || 0);
      
      periodData.total_gst += saleGST;
      periodData.total_sales += saleValue;
      periodData.taxable_amount += taxableAmount;
      periodData.exempt_amount += exemptAmount;
      periodData.invoice_count += 1;
      
      totalGST += saleGST;
      totalSalesValue += saleValue;
      totalTaxableAmount += taxableAmount;
      totalExemptAmount += exemptAmount;
      invoiceCount += 1;

      // Analyze GST by rate from items
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const gstRateObj = item.sales_item_type === 'GOODS' ? item.goods?.gstRate : item.service?.gstRate;
          const gstRate = gstRateObj?.gst_percentage || 0;
          const itemGST = Number(item.gst_amount || 0);
          const itemTaxable = Number(item.taxable_amount || 0);
          
          // Track GST by rate
          if (gstRate > 0 && itemGST > 0) {
            if (!periodData.gst_by_rate.has(gstRate)) {
              periodData.gst_by_rate.set(gstRate, {
                rate: gstRate,
                total_gst: 0,
                items_count: 0,
                taxable_amount: 0
              });
            }
            if (!gstRateSummary.has(gstRate)) {
              gstRateSummary.set(gstRate, {
                rate: gstRate,
                total_gst: 0,
                items_count: 0,
                taxable_amount: 0
              });
            }
            
            const periodRateData = periodData.gst_by_rate.get(gstRate);
            periodRateData.total_gst += itemGST;
            periodRateData.items_count += 1;
            periodRateData.taxable_amount += itemTaxable;
            
            const summaryRateData = gstRateSummary.get(gstRate);
            summaryRateData.total_gst += itemGST;
            summaryRateData.items_count += 1;
            summaryRateData.taxable_amount += itemTaxable;
          }
          
          // Track by tax type (goods vs services)
          if (item.sales_item_type === 'GOODS') {
            periodData.tax_type.goods.gst += itemGST;
            periodData.tax_type.goods.count += 1;
            periodData.tax_type.goods.taxable += itemTaxable;
            
            taxTypeBreakdown.goods.gst += itemGST;
            taxTypeBreakdown.goods.count += 1;
            taxTypeBreakdown.goods.taxable += itemTaxable;
          } else if (item.sales_item_type === 'SERVICE') {
            periodData.tax_type.services.gst += itemGST;
            periodData.tax_type.services.count += 1;
            periodData.tax_type.services.taxable += itemTaxable;
            
            taxTypeBreakdown.services.gst += itemGST;
            taxTypeBreakdown.services.count += 1;
            taxTypeBreakdown.services.taxable += itemTaxable;
          }
        });
      }
    });

    // Process previous period data if needed
    let previousPeriodTrends = null;
    if (previousPeriodData && compareWithPrevious) {
      const prevTrends = new Map();
      
      previousPeriodData.forEach(sale => {
        const saleDate = new Date(sale.sales_date);
        const periodKey = getPeriodKey(saleDate, periodType);
        
        if (!prevTrends.has(periodKey)) {
          prevTrends.set(periodKey, {
            period: periodKey,
            total_gst: 0,
            total_sales: 0,
            invoice_count: 0
          });
        }

        const periodData = prevTrends.get(periodKey);
        periodData.total_gst += Number(sale.gst_amount || 0);
        periodData.total_sales += Number(sale.total_invoice_amount || 0);
        periodData.invoice_count += 1;
      });
      
      previousPeriodTrends = Array.from(prevTrends.values())
        .sort((a, b) => a.period.localeCompare(b.period));
    }

    // Convert maps to arrays
    const gstTrendsArray = Array.from(gstTrends.values())
      .sort((a, b) => a.period_start - b.period_start)
      .map(period => ({
        ...period,
        total_gst: Number(period.total_gst.toFixed(2)),
        total_sales: Number(period.total_sales.toFixed(2)),
        taxable_amount: Number(period.taxable_amount.toFixed(2)),
        exempt_amount: Number(period.exempt_amount.toFixed(2)),
        gst_by_rate: Array.from(period.gst_by_rate.values()).map(rate => ({
          ...rate,
          total_gst: Number(rate.total_gst.toFixed(2)),
          taxable_amount: Number(rate.taxable_amount.toFixed(2))
        })),
        tax_type: {
          goods: {
            gst: Number(period.tax_type.goods.gst.toFixed(2)),
            count: period.tax_type.goods.count,
            taxable: Number(period.tax_type.goods.taxable.toFixed(2))
          },
          services: {
            gst: Number(period.tax_type.services.gst.toFixed(2)),
            count: period.tax_type.services.count,
            taxable: Number(period.tax_type.services.taxable.toFixed(2))
          }
        },
        gst_percentage_of_sales: period.total_sales > 0 
          ? Number(((period.total_gst / period.total_sales) * 100).toFixed(2))
          : 0,
        gst_percentage_of_taxable: period.taxable_amount > 0 
          ? Number(((period.total_gst / period.taxable_amount) * 100).toFixed(2))
          : 0
      }));

    // Prepare tax breakdown
    const taxBreakdown = {
      goods: {
        gst: Number(taxTypeBreakdown.goods.gst.toFixed(2)),
        count: taxTypeBreakdown.goods.count,
        taxable: Number(taxTypeBreakdown.goods.taxable.toFixed(2)),
        percentage: totalGST > 0 
          ? Number(((taxTypeBreakdown.goods.gst / totalGST) * 100).toFixed(2))
          : 0
      },
      services: {
        gst: Number(taxTypeBreakdown.services.gst.toFixed(2)),
        count: taxTypeBreakdown.services.count,
        taxable: Number(taxTypeBreakdown.services.taxable.toFixed(2)),
        percentage: totalGST > 0 
          ? Number(((taxTypeBreakdown.services.gst / totalGST) * 100).toFixed(2))
          : 0
      },
      taxable_vs_exempt: {
        taxable_amount: Number(totalTaxableAmount.toFixed(2)),
        exempt_amount: Number(totalExemptAmount.toFixed(2)),
        taxable_percentage: totalSalesValue > 0 
          ? Number(((totalTaxableAmount / totalSalesValue) * 100).toFixed(2))
          : 0,
        exempt_percentage: totalSalesValue > 0 
          ? Number(((totalExemptAmount / totalSalesValue) * 100).toFixed(2))
          : 0
      }
    };

    // Prepare GST rate summary
    const gstRateArray = Array.from(gstRateSummary.values())
      .sort((a, b) => b.rate - a.rate)
      .map(item => ({
        ...item,
        total_gst: Number(item.total_gst.toFixed(2)),
        taxable_amount: Number(item.taxable_amount.toFixed(2)),
        percentage_of_total: totalGST > 0 
          ? Number(((item.total_gst / totalGST) * 100).toFixed(2))
          : 0,
        avg_gst_per_item: item.items_count > 0 
          ? Number((item.total_gst / item.items_count).toFixed(2))
          : 0
      }));

    // Prepare period comparison
    let periodComparison = null;
    if (compareWithPrevious && previousPeriodTrends) {
      const currentTotal = gstTrendsArray.reduce((sum, period) => sum + period.total_gst, 0);
      const previousTotal = previousPeriodTrends.reduce((sum, period) => sum + period.total_gst, 0);
      
      periodComparison = {
        current_period_total: Number(currentTotal.toFixed(2)),
        previous_period_total: Number(previousTotal.toFixed(2)),
        change_amount: Number((currentTotal - previousTotal).toFixed(2)),
        change_percentage: previousTotal > 0 
          ? Number(((currentTotal - previousTotal) / previousTotal * 100).toFixed(2))
          : currentTotal > 0 ? 100 : 0,
        period_label: `vs Previous ${getPeriodDurationLabel(startDate, endDate)}`
      };
    }

    // Prepare summary
    const summary = {
      total_gst_collected: Number(totalGST.toFixed(2)),
      total_sales_value: Number(totalSalesValue.toFixed(2)),
      taxable_amount: Number(totalTaxableAmount.toFixed(2)),
      exempt_amount: Number(totalExemptAmount.toFixed(2)),
      average_gst_per_invoice: invoiceCount > 0 
        ? Number((totalGST / invoiceCount).toFixed(2))
        : 0,
      average_gst_rate: totalTaxableAmount > 0 
        ? Number(((totalGST / totalTaxableAmount) * 100).toFixed(2))
        : 0,
      gst_percentage_of_sales: totalSalesValue > 0 
        ? Number(((totalGST / totalSalesValue) * 100).toFixed(2))
        : 0,
      total_invoices: invoiceCount,
      period_count: gstTrendsArray.length,
      period_type: periodType,
      distinct_gst_rates: gstRateArray.length
    };

    // Export to CSV if requested
    if (exportExcel) {
      return generateCSVReport(
        gstTrendsArray,
        taxBreakdown,
        gstRateArray,
        summary,
        periodComparison,
        fromDate,
        toDate
      );
    }

    return Response.json({
      success: true,
      data: {
        gstTrends: gstTrendsArray,
        taxBreakdown,
        gstRateSummary: gstRateArray,
        periodComparison,
        previousPeriodTrends: compareWithPrevious ? previousPeriodTrends : null
      },
      summary,
      filters: {
        from_date: fromDate,
        to_date: toDate,
        period_type: periodType,
        compare_with_previous: compareWithPrevious
      }
    });

  } catch (error) {
    console.error("Error generating GST trend analysis:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to get period duration label
function getPeriodDurationLabel(startDate, endDate) {
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 31) {
    return "Month";
  } else if (diffDays <= 93) {
    return "Quarter";
  } else if (diffDays <= 365) {
    return "Year";
  } else {
    return "Period";
  }
}

// Helper function to generate CSV report
function generateCSVReport(trends, breakdown, rateSummary, summary, comparison, fromDate, toDate) {
  // Create report info
  const reportInfo = [
    'GST Collection Trend Analysis Report',
    '',
    `Period: ${fromDate} to ${toDate}`,
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
  ];

  // Add summary
  reportInfo.push('SUMMARY');
  reportInfo.push(`Period: ${fromDate} to ${toDate}`);
  reportInfo.push(`Total GST Collected: ${summary.total_gst_collected}`);
  reportInfo.push(`Total Sales Value: ${summary.total_sales_value}`);
  reportInfo.push(`Taxable Amount: ${summary.taxable_amount}`);
  reportInfo.push(`Exempt Amount: ${summary.exempt_amount}`);
  reportInfo.push(`Total Invoices: ${summary.total_invoices}`);
  reportInfo.push(`Average GST per Invoice: ${summary.average_gst_per_invoice}`);
  reportInfo.push(`Average GST Rate (on taxable): ${summary.average_gst_rate}%`);
  reportInfo.push('');

  // Add period comparison if available
  if (comparison) {
    reportInfo.push('PERIOD COMPARISON');
    reportInfo.push(`Current Period Total: ${comparison.current_period_total}`);
    reportInfo.push(`Previous Period Total: ${comparison.previous_period_total}`);
    reportInfo.push(`Change: ${comparison.change_amount} (${comparison.change_percentage}%)`);
    reportInfo.push('');
  }

  // Add tax breakdown
  reportInfo.push('TAX BREAKDOWN');
  reportInfo.push(`Goods GST: ${breakdown.goods.gst} (${breakdown.goods.percentage}%)`);
  reportInfo.push(`Services GST: ${breakdown.services.gst} (${breakdown.services.percentage}%)`);
  reportInfo.push(`Taxable Amount: ${breakdown.taxable_vs_exempt.taxable_amount} (${breakdown.taxable_vs_exempt.taxable_percentage}% of sales)`);
  reportInfo.push(`Exempt Amount: ${breakdown.taxable_vs_exempt.exempt_amount} (${breakdown.taxable_vs_exempt.exempt_percentage}% of sales)`);
  reportInfo.push('');

  // Add GST by period
  reportInfo.push('GST COLLECTION BY PERIOD');
  const trendHeaders = [
    'Period',
    'GST Collected',
    'Total Sales',
    'Taxable Amount',
    'Exempt Amount',
    'Invoice Count',
    'GST % of Sales',
    'Goods GST',
    'Services GST'
  ];

  const trendRows = trends.map(period => [
    period.period,
    period.total_gst,
    period.total_sales,
    period.taxable_amount,
    period.exempt_amount,
    period.invoice_count,
    `${period.gst_percentage_of_sales}%`,
    period.tax_type.goods.gst,
    period.tax_type.services.gst
  ]);

  reportInfo.push(trendHeaders.join(',') + '\n');
  reportInfo.push(trendRows.map(row => row.join(',')).join('\n') + '\n\n');

  // Add GST by rate
  if (rateSummary.length > 0) {
    reportInfo.push('GST COLLECTION BY RATE');
    const rateHeaders = [
      'GST Rate (%)',
      'Total GST',
      'Taxable Amount',
      'Item Count',
      '% of Total GST',
      'Avg GST per Item'
    ];

    const rateRows = rateSummary.map(rate => [
      rate.rate,
      rate.total_gst,
      rate.taxable_amount,
      rate.items_count,
      `${rate.percentage_of_total}%`,
      rate.avg_gst_per_item
    ]);

    reportInfo.push(rateHeaders.join(',') + '\n');
    reportInfo.push(rateRows.map(row => row.join(',')).join('\n'));
  }

  const csvContent = reportInfo.join('\n');

  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `gst-trend-analysis-${fromDate}-to-${toDate}.csv`;
  
  return new Response(blob, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}