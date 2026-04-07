"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  ArrowUpDown,
  FileText,
  Percent,
  TrendingUp,
  Filter,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function GstSummaryReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  
  // Fetch report data
  const fetchReportData = async () => {
    // Validate dates
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
      
      const response = await fetch(`/api/reports/gst-summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary);
        setPeriod(data.period);
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
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
      params.append('export', 'excel');
      
      const response = await fetch(`/api/reports/gst-summary?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gst-summary-report-${fromDate}-to-${toDate}.csv`;
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
    setFromDate('');
    setToDate('');
    setReportData([]);
    setSummary(null);
    setPeriod(null);
    setDateError('');
    setHasFetched(false);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'IP':
        return 'bg-yellow-100 text-yellow-800';
      case 'UP':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'PAID': return 'Paid';
      case 'IP': return 'In Progress';
      case 'UP': return 'Unpaid';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">GST Summary Report</h1>
          <p className="text-gray-600">View GST summary for a selected period with tax breakdown</p>
        </div>
        
        {/* Date Selection Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Select Period</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={toDate}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateError('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={fromDate}
              />
            </div>
          </div>
          
          {dateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{dateError}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={fetchReportData}
              disabled={loading || !fromDate || !toDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Summary Section */}
        {summary && period && (
          <>
            {/* Period Display */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-blue-700">Selected Period:</span>
                    <span className="ml-2 text-sm text-blue-900">
                      {formatDate(period.from_date)} to {formatDate(period.to_date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={exportToCSV}
                  disabled={exporting || reportData.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
            
            {/* GST Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.total_sales || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Taxable Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.total_taxable_value)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Exempt Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.total_exempt_amount)}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total GST Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.total_gst_amount)}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Percent className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* GST Summary Details */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Summary Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium text-gray-600">Total Taxable Value:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(summary.total_taxable_value)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium text-gray-600">Total Exempt Amount:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(summary.total_exempt_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium text-gray-600">Total GST Amount:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(summary.total_gst_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-bold text-gray-900">Total Invoice Amount:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(summary.total_invoice_amount)}
                    </span>
                  </div>
                </div>
                
                
              </div>
            </div>
            
            {/* Sales Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Sales Details for Selected Period</h3>
                <p className="text-sm text-gray-600">
                  Showing {reportData.length} sale{reportData.length !== 1 ? 's' : ''} from {formatDate(period.from_date)} to {formatDate(period.to_date)}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          Invoice No
                          <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taxable Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exempt Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Invoice
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                          <p className="mt-2 text-gray-500">Loading sales data...</p>
                        </td>
                      </tr>
                    ) : reportData.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                          No sales found for the selected period
                        </td>
                      </tr>
                    ) : (
                      reportData.map((sale, index) => (
                        <tr key={sale.sales_id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {sale.sales_invoice_no || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(sale.sales_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {sale.customer_name || 'Unknown'}
                              {sale.customer_tpn && (
                                <div className="text-xs text-gray-500">
                                  TPN: {sale.customer_tpn}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(sale.taxable_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(sale.exempt_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600 font-medium">
                              {formatCurrency(sale.gst_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(sale.total_invoice_amount)}
                            </div>
                          </td>
                          
                        </tr>
                      ))
                    )}
                  </tbody>
                  
                  {/* Summary Row */}
                  {!loading && reportData.length > 0 && summary && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-gray-900">PERIOD TOTALS:</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(summary.total_taxable_value)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(summary.total_exempt_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(summary.total_gst_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(summary.total_invoice_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Empty for status column */}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            
            {/* Footer Info */}
            <div className="mt-4 text-sm text-gray-500">
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p className="font-medium">Export will include all sales data for the selected period</p>
            </div>
          </>
        )}
        
        {/* Initial State - No Date Selected */}
        {!hasFetched && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Date Range</h3>
            <p className="text-gray-600 mb-6">
              Please select a start and end date to generate the GST Summary Report
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Total Taxable Value</span>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                <span>Exempt Amount</span>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span>GST Amount</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}