"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Download, 
  Calendar,
  PieChart,
  BarChart3,
  LineChart,
  Percent,
  DollarSign,
  FileText,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Minus,
  Layers,
  Package,
  Tag,
  BarChart4,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function GSTTrendAnalysis() {
  const [gstTrends, setGstTrends] = useState([]);
  const [taxBreakdown, setTaxBreakdown] = useState(null);
  const [gstRateSummary, setGstRateSummary] = useState([]);
  const [periodComparison, setPeriodComparison] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [periodType, setPeriodType] = useState('monthly');
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [dateError, setDateError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  
  // Chart options states
  const [trendChartOptions, setTrendChartOptions] = useState(null);
  const [trendChartSeries, setTrendChartSeries] = useState([]);
  
  const [breakdownChartOptions, setBreakdownChartOptions] = useState(null);
  const [breakdownChartSeries, setBreakdownChartSeries] = useState([]);
  
  const [taxableExemptChartOptions, setTaxableExemptChartOptions] = useState(null);
  const [taxableExemptChartSeries, setTaxableExemptChartSeries] = useState([]);
  
  const [rateChartOptions, setRateChartOptions] = useState(null);
  const [rateChartSeries, setRateChartSeries] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize with default dates (last 6 months)
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
  }, []);

  // mark client mount to avoid rendering charts before DOM is ready
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch GST trend data
  const fetchGSTTrends = async () => {
    if (!fromDate || !toDate) {
      setDateError('Please select both start and end dates');
      return;
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
      setDateError('Start date cannot be after end date');
      return;
    }
    
    setDateError('');
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      params.append('period_type', periodType);
      params.append('compare', compareWithPrevious);
      
      const response = await fetch(`/api/reports/gst-trend-analysis?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGstTrends(Array.isArray(data.data.gstTrends) ? data.data.gstTrends : []);
        setTaxBreakdown(data.data.taxBreakdown);
        setGstRateSummary(Array.isArray(data.data.gstRateSummary) ? data.data.gstRateSummary : []);
        setPeriodComparison(data.data.periodComparison);
        setSummary(data.summary);
        setHasFetched(true);
        
        // Prepare ApexCharts data
        prepareChartData(data.data.gstTrends, data.data.taxBreakdown, data.data.gstRateSummary);
      }
    } catch (error) {
      console.error('Error fetching GST trends:', error);
      setGstTrends([]);
      setTaxBreakdown(null);
      setGstRateSummary([]);
      setPeriodComparison(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare ApexCharts data
  const prepareChartData = (trends, breakdown, rates) => {
    if (!trends || trends.length === 0) return;
    
    // 1. Trend Line Chart
    const labels = trends.map(t => t.period);
    const gstData = trends.map(t => t.total_gst);
    const taxableData = trends.map(t => t.taxable_amount);
    
    setTrendChartOptions({
      chart: {
  type: 'line',
  height: 350,
  width: '100%',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        }
      },
      colors: ['#3B82F6', '#10B981'],
      stroke: {
        width: [3, 2],
        curve: 'smooth'
      },
      markers: {
        size: 5
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px'
          }
        }
      },
      yaxis: [
        {
          title: {
            text: 'GST Collected',
            style: {
              color: '#3B82F6',
              fontSize: '12px'
            }
          },
          labels: {
            style: {
              colors: '#3B82F6'
            },
            formatter: (value) => `₹${formatNumber(value)}`
          }
        },
        {
          opposite: true,
          title: {
            text: 'Taxable Amount',
            style: {
              color: '#10B981',
              fontSize: '12px'
            }
          },
          labels: {
            style: {
              colors: '#10B981'
            },
            formatter: (value) => `₹${formatNumber(value)}`
          }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (value) => `₹${formatNumber(value)}`
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center'
      }
    });
    
    setTrendChartSeries([
      {
        name: 'GST Collected',
        type: 'line',
        data: gstData
      },
      {
        name: 'Taxable Amount',
        type: 'line',
        data: taxableData
      }
    ]);
    
    // 2. Breakdown Pie Chart (Goods vs Services)
    if (breakdown) {
      setBreakdownChartOptions({
        chart: {
          type: 'pie',
          height: 350,
          width: '100%'
        },
        colors: ['#3B82F6', '#10B981'],
        labels: ['Goods', 'Services'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        legend: {
          position: 'bottom'
        },
        tooltip: {
          y: {
            formatter: (value) => `₹${formatNumber(value)}`
          }
        }
      });
      
      setBreakdownChartSeries([breakdown.goods.gst, breakdown.services.gst]);
    }
    
    // 3. Taxable vs Exempt Bar Chart
    if (breakdown?.taxable_vs_exempt) {
      setTaxableExemptChartOptions({
        chart: {
          type: 'bar',
          height: 350,
          width: '100%',
          toolbar: {
            show: false
          }
        },
        colors: ['#3B82F6', '#9CA3AF'],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: ['Taxable Sales', 'Exempt Sales'],
          labels: {
            style: {
              colors: '#6B7280',
              fontSize: '12px'
            }
          }
        },
        yaxis: {
          title: {
            text: 'Amount',
            style: {
              fontSize: '12px'
            }
          },
          labels: {
            formatter: (value) => `₹${formatNumber(value)}`
          }
        },
        tooltip: {
          y: {
            formatter: (value) => `₹${formatNumber(value)}`
          }
        }
      });
      
      setTaxableExemptChartSeries([{
        name: 'Amount',
        data: [
          breakdown.taxable_vs_exempt.taxable_amount,
          breakdown.taxable_vs_exempt.exempt_amount
        ]
      }]);
    }
    
    // 4. GST Rates Bar Chart
    if (rates && rates.length > 0) {
      const rateLabels = rates.map(r => `${r.rate}%`);
      const rateData = rates.map(r => r.total_gst);
      
      setRateChartOptions({
        chart: {
          type: 'bar',
          height: 350,
          width: '100%',
          toolbar: {
            show: false
          }
        },
        colors: rates.map((rate, index) => {
          const hue = index * 60;
          return `hsl(${hue}, 70%, 60%)`;
        }),
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: rateLabels,
          labels: {
            style: {
              colors: '#6B7280',
              fontSize: '12px'
            }
          }
        },
        yaxis: {
          title: {
            text: 'GST Collected',
            style: {
              fontSize: '12px'
            }
          },
          labels: {
            formatter: (value) => `₹${formatNumber(value)}`
          }
        },
        tooltip: {
          y: {
            formatter: (value) => `₹${formatNumber(value)}`
          }
        }
      });
      
      setRateChartSeries([{
        name: 'GST Collected by Rate',
        data: rateData
      }]);
    }
  };
  
  // Helper function to format numbers for charts
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };
  
  // Export to CSV
  const exportToCSV = async () => {
    if (!fromDate || !toDate) {
      setDateError('Please select both dates before exporting');
      return;
    }
    
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      params.append('period_type', periodType);
      params.append('compare', compareWithPrevious);
      params.append('export', 'excel');
      
      const response = await fetch(`/api/reports/gst-trend-analysis?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gst-trend-analysis-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  
  // Reset filters
  const handleResetFilters = () => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFromDate(formatDate(sixMonthsAgo));
    setToDate(formatDate(today));
    setPeriodType('monthly');
    setCompareWithPrevious(false);
    setGstTrends([]);
    setTaxBreakdown(null);
    setGstRateSummary([]);
    setPeriodComparison(null);
    setSummary(null);
    setDateError('');
    setHasFetched(false);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${Number(value).toFixed(2)}%`;
  };
  
  // Get change indicator
  const getChangeIndicator = (change) => {
    if (change > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'increase',
        arrow: <ArrowUpRight className="h-4 w-4 text-green-600" />
      };
    } else if (change < 0) {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'decrease',
        arrow: <ArrowDownRight className="h-4 w-4 text-red-600" />
      };
    } else {
      return {
        icon: <Minus className="h-4 w-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'no change',
        arrow: <Minus className="h-4 w-4 text-gray-600" />
      };
    }
  };
  
  // Fetch data on initial load
  useEffect(() => {
    if (fromDate && toDate) {
      fetchGSTTrends();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart4 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">GST Collection Trend Analysis</h1>
                  <p className="text-gray-600">Visualize monthly/quarterly GST collection patterns and growth</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={exporting || !hasFetched}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export Report'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Date Selection Card */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Analysis Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                max={toDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min={fromDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Period Type
              </label>
              <div className="relative">
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="monthly">Monthly Analysis</option>
                  <option value="quarterly">Quarterly Analysis</option>
                  <option value="yearly">Yearly Analysis</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-colors w-full">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={compareWithPrevious}
                    onChange={(e) => setCompareWithPrevious(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Compare with previous period</span>
                  <p className="text-xs text-gray-500">View growth trends</p>
                </div>
              </label>
            </div>
          </div>
          
          {dateError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-pulse">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{dateError}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={fetchGSTTrends}
              disabled={loading || !fromDate || !toDate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Analyzing...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Analyze GST Trends</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-lg hover:from-gray-300 hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-all duration-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
                <TrendingUp className="h-6 w-6 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-700">Analyzing GST Collection Data</p>
              <p className="mt-2 text-gray-500">Crunching numbers and generating insights...</p>
            </div>
          </div>
        )}
        
        {/* Report Content */}
        {!loading && summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total GST Collected</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹{formatCurrency(summary.total_gst_collected)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((summary.total_gst_collected / (summary.total_sales_value || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-blue-700">
                        {formatPercentage(summary.gst_percentage_of_sales)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Taxable Amount</p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{formatCurrency(summary.taxable_amount)}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      {formatPercentage(summary.taxable_amount / (summary.total_sales_value || 1) * 100)} of total sales
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Percent className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Avg GST per Invoice</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ₹{formatCurrency(summary.average_gst_per_invoice)}
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      From {summary.total_invoices} invoices
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Average GST Rate</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatPercentage(summary.average_gst_rate)}
                    </p>
                    <p className="text-sm text-orange-600 mt-2">
                      On taxable amount
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Period Comparison */}
            {periodComparison && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Period Comparison</h3>
                      <p className="text-sm text-gray-500">{periodComparison.period_label}</p>
                    </div>
                  </div>
                  {getChangeIndicator(periodComparison.change_percentage).arrow}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Previous Period</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{formatCurrency(periodComparison.previous_period_total)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-600 mb-2">Current Period</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹{formatCurrency(periodComparison.current_period_total)}
                    </p>
                  </div>
                  
                  <div className={`text-center p-4 rounded-lg ${getChangeIndicator(periodComparison.change_percentage).bgColor}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getChangeIndicator(periodComparison.change_percentage).icon}
                      <span className={`text-sm font-medium ${getChangeIndicator(periodComparison.change_percentage).color}`}>
                        {formatPercentage(Math.abs(periodComparison.change_percentage))}
                      </span>
                    </div>
                    <p className={`text-lg font-bold ${getChangeIndicator(periodComparison.change_percentage).color}`}>
                      ₹{formatCurrency(Math.abs(periodComparison.change_amount))}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {getChangeIndicator(periodComparison.change_percentage).label}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* GST Trend Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <LineChart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">GST Collection Trend</h3>
                      <p className="text-sm text-gray-500">
                        {periodType === 'monthly' ? 'Monthly' : periodType === 'quarterly' ? 'Quarterly' : 'Yearly'} View
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-600">GST</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Taxable</span>
                    </div>
                  </div>
                </div>
                <div className="h-[260px] md:h-[360px] relative overflow-hidden">
                  {isMounted && trendChartOptions && trendChartSeries.length > 0 ? (
                    <Chart
                      options={trendChartOptions}
                      series={trendChartSeries}
                      type="line"
                      height="100%"
                      width="100%"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <LineChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No trend data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tax Breakdown Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                      <PieChart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">GST by Type</h3>
                      <p className="text-sm text-gray-500">Goods vs Services Breakdown</p>
                    </div>
                  </div>
                </div>
                <div className="h-[260px] md:h-[360px] relative overflow-hidden">
                  {isMounted && breakdownChartOptions && breakdownChartSeries.length > 0 ? (
                    <>
                      <Chart
                        options={breakdownChartOptions}
                        series={breakdownChartSeries}
                        type="pie"
                        height="100%"
                        width="100%"
                      />
                      {taxBreakdown && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-700">Goods GST</div>
                            <div className="text-lg font-bold text-blue-900">₹{formatCurrency(taxBreakdown.goods.gst)}</div>
                            <div className="text-xs text-blue-600">{formatPercentage(taxBreakdown.goods.percentage)} of total</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-700">Services GST</div>
                            <div className="text-lg font-bold text-green-900">₹{formatCurrency(taxBreakdown.services.gst)}</div>
                            <div className="text-xs text-green-600">{formatPercentage(taxBreakdown.services.percentage)} of total</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No breakdown data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Taxable vs Exempt Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Taxable vs Exempt Sales</h3>
                      <p className="text-sm text-gray-500">Sales composition analysis</p>
                    </div>
                  </div>
                </div>
                <div className="h-[260px] md:h-[360px] relative overflow-hidden">
                  {isMounted && taxableExemptChartOptions && taxableExemptChartSeries.length > 0 ? (
                    <>
                      <Chart
                        options={taxableExemptChartOptions}
                        series={taxableExemptChartSeries}
                        type="bar"
                        height="100%"
                        width="100%"
                      />
                      {taxBreakdown?.taxable_vs_exempt && (
                        <div className="mt-4 flex justify-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Taxable</div>
                            <div className="text-lg font-bold text-blue-600">{formatPercentage(taxBreakdown.taxable_vs_exempt.taxable_percentage)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Exempt</div>
                            <div className="text-lg font-bold text-gray-600">{formatPercentage(taxBreakdown.taxable_vs_exempt.exempt_percentage)}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No tax composition data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* GST Rates Chart */}
              {gstRateSummary.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                        <Tag className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">GST by Rate</h3>
                        <p className="text-sm text-gray-500">{gstRateSummary.length} different GST rates</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-[260px] md:h-[360px] relative overflow-hidden">
                    {isMounted && rateChartOptions && rateChartSeries.length > 0 ? (
                      <Chart
                        options={rateChartOptions}
                        series={rateChartSeries}
                        type="bar"
                        height="100%"
                        width="100%"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No rate data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Detailed Data Table */}
            <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                      <Layers className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Detailed GST Collection by Period</h3>
                      <p className="text-sm text-gray-500">Click on any period to view detailed breakdown</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {gstTrends.length} periods
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        GST Collected
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Taxable
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Exempt
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Invoices
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        GST %
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Breakdown
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gstTrends.map((period) => (
                      <tr 
                        key={period.period} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => console.log('Period details:', period)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{period.period}</div>
                              <div className="text-xs text-gray-500">Period</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-bold text-blue-700">
                            ₹{formatCurrency(period.total_gst)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹{formatCurrency(period.total_sales)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-700">
                            ₹{formatCurrency(period.taxable_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            ₹{formatCurrency(period.exempt_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {period.invoice_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(period.gst_percentage_of_sales * 5, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-blue-600">
                              {formatPercentage(period.gst_percentage_of_sales)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <Package className="h-3 w-3 mr-1" />
                              ₹{formatCurrency(period.tax_type.goods.gst)}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Tag className="h-3 w-3 mr-1" />
                              ₹{formatCurrency(period.tax_type.services.gst)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {gstTrends.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <BarChart3 className="h-12 w-12 mx-auto opacity-30" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No GST Data Found</h3>
                    <p className="text-gray-500">Try adjusting your date range or filters</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Info */}
            <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    Analysis period: {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">GST Collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Taxable Amount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600">Goods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-gray-600">Services</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Initial State - No Data Yet */}
        {!loading && !hasFetched && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Analyze GST Trends</h3>
              <p className="text-gray-600 mb-6">
                Select your date range and click "Analyze GST Trends" to generate comprehensive GST collection insights
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Trend Analysis</span>
                  </div>
                  <p className="text-xs text-gray-600">Visualize GST collection patterns over time</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">Breakdown</span>
                  </div>
                  <p className="text-xs text-gray-600">Goods vs Services GST contribution</p>
                </div>
              </div>
              <button
                onClick={fetchGSTTrends}
                disabled={!fromDate || !toDate}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full"
              >
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}