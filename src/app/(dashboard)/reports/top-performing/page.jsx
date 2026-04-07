"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Percent,
  Award,
  Star,
  Filter,
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export default function TopPerformingReport() {
  const [reportData, setReportData] = useState({
    topCustomers: [],
    topProductsByValue: [],
    topProductsByQuantity: []
  });
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'products', 'all'
  const [limit, setLimit] = useState(10);
  
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
      params.append('limit', limit);
      params.append('type', activeTab);
      
      const response = await fetch(`/api/reports/top-performing?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Safely set report data with defaults
        setReportData({
          topCustomers: Array.isArray(data.data.topCustomers) ? data.data.topCustomers : [],
          topProductsByValue: Array.isArray(data.data.topProductsByValue) ? data.data.topProductsByValue : [],
          topProductsByQuantity: Array.isArray(data.data.topProductsByQuantity) ? data.data.topProductsByQuantity : []
        });
        setSummary(data.summary);
        setPeriod(data.period);
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      // Reset to empty arrays on error
      setReportData({
        topCustomers: [],
        topProductsByValue: [],
        topProductsByQuantity: []
      });
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
      params.append('limit', limit);
      params.append('type', activeTab);
      params.append('export', 'excel');
      
      const response = await fetch(`/api/reports/top-performing?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-performing-report-${fromDate}-to-${toDate}.csv`;
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
    setReportData({
      topCustomers: [],
      topProductsByValue: [],
      topProductsByQuantity: []
    });
    setSummary(null);
    setPeriod(null);
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
  
  // Get rank badge color
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-gray-100 text-gray-800';
      case 3: return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Get contribution color
  const getContributionColor = (percentage) => {
    if (percentage > 20) return 'text-green-600';
    if (percentage > 10) return 'text-blue-600';
    if (percentage > 5) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (hasFetched) {
      fetchReportData();
    }
  };
  
  // Safe array length check
  const hasProductsData = () => {
    return (
      Array.isArray(reportData.topProductsByValue) && 
      Array.isArray(reportData.topProductsByQuantity) &&
      (reportData.topProductsByValue.length > 0 || reportData.topProductsByQuantity.length > 0)
    );
  };
  
  const hasCustomersData = () => {
    return Array.isArray(reportData.topCustomers) && reportData.topCustomers.length > 0;
  };
  
  // Initial fetch when tab changes
  useEffect(() => {
    if (hasFetched) {
      fetchReportData();
    }
  }, [activeTab, limit]);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Top Performing Report</h1>
          <p className="text-gray-600">Show highest revenue-generating customers and products</p>
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
              <TrendingUp className="h-4 w-4" />
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
        
        {/* Report Content */}
        {summary && period && (
          <>
            {/* Period and Controls */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-blue-700">Period:</span>
                    <span className="ml-2 text-sm text-blue-900">
                      {new Date(period.from_date).toLocaleDateString()} to {new Date(period.to_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Show Top:</label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">Top 5</option>
                      <option value="10">Top 10</option>
                      <option value="15">Top 15</option>
                      <option value="20">Top 20</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={exportToCSV}
                    disabled={exporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Period Sales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.period_total_sales)}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.total_customers}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.total_products}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Top 10 Contribution</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(summary.top_customer_percentage)}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Percent className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => handleTabChange('customers')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === 'customers'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Top Customers
                        {hasCustomersData() && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {reportData.topCustomers.length}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('products')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === 'products'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Top Products
                        {hasProductsData() && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {reportData.topProductsByValue.length}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('all')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === 'all'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Complete View
                      </div>
                    </button>
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-gray-500">Loading report data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Top Customers */}
                      {(activeTab === 'customers' || activeTab === 'all') && hasCustomersData() && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Award className="h-5 w-5 text-yellow-500" />
                              Top {limit} Customers by Sales Value
                            </h3>
                            <div className="text-sm text-gray-500">
                              Contribution: {formatPercentage(
                                reportData.topCustomers.reduce((sum, cust) => sum + cust.contribution_percentage, 0)
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer Details
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoices
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Sales Value
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contribution
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.topCustomers.map((customer, index) => (
                                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRankColor(index + 1)}`}>
                                        #{index + 1}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {customer.customer_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          TPN: {customer.tpn}
                                          {customer.email && ` • ${customer.email}`}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {customer.invoice_count} invoice{customer.invoice_count !== 1 ? 's' : ''}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-gray-900">
                                        {formatCurrency(customer.total_sales_value)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                          <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${Math.min(customer.contribution_percentage * 3, 100)}%` }}
                                          ></div>
                                        </div>
                                        <span className={`text-sm font-medium ${getContributionColor(customer.contribution_percentage)}`}>
                                          {formatPercentage(customer.contribution_percentage)}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Top Products by Value */}
                      {(activeTab === 'products' || activeTab === 'all') && 
                       Array.isArray(reportData.topProductsByValue) && 
                       reportData.topProductsByValue.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Star className="h-5 w-5 text-blue-500" />
                              Top {limit} Products by Sales Value
                            </h3>
                            <div className="text-sm text-gray-500">
                              Contribution: {formatPercentage(
                                reportData.topProductsByValue.reduce((sum, prod) => sum + prod.contribution_percentage, 0)
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Details
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Price
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Sales Value
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contribution
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.topProductsByValue.map((product, index) => (
                                  <tr key={product.product_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRankColor(index + 1)}`}>
                                        #{index + 1}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {product.product_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Type: {product.product_type}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {product.total_quantity}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {formatCurrency(product.unit_price_avg)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-gray-900">
                                        {formatCurrency(product.total_sales_value)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                          <div 
                                            className="bg-green-600 h-2 rounded-full" 
                                            style={{ width: `${Math.min(product.contribution_percentage * 3, 100)}%` }}
                                          ></div>
                                        </div>
                                        <span className={`text-sm font-medium ${getContributionColor(product.contribution_percentage)}`}>
                                          {formatPercentage(product.contribution_percentage)}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Top Products by Quantity */}
                      {(activeTab === 'products' || activeTab === 'all') && 
                       Array.isArray(reportData.topProductsByQuantity) && 
                       reportData.topProductsByQuantity.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <Package className="h-5 w-5 text-green-500" />
                              Top {limit} Products by Quantity Sold
                            </h3>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Details
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity Sold
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Value
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.topProductsByQuantity.map((product, index) => (
                                  <tr key={`quantity-${product.product_id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRankColor(index + 1)}`}>
                                        #{index + 1}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {product.product_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Type: {product.product_type}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-gray-900">
                                        {product.total_quantity}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {formatCurrency(product.total_sales_value)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {formatCurrency(product.unit_price_avg)}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* No Data Message */}
                      {!hasCustomersData() && !hasProductsData() && (
                        <div className="py-12 text-center text-gray-500">
                          No data found for the selected period
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Footer Info */}
              <div className="mt-4 text-sm text-gray-500">
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="font-medium">Showing top {limit} performers for the selected period</p>
              </div>
            </div>
          </>
        )}
        
        {/* Initial State - No Date Selected */}
        {!hasFetched && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Date Range</h3>
            <p className="text-gray-600 mb-6">
              Please select a start and end date to generate the Top Performing Report
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Top Customers</h4>
                <p className="text-xs text-gray-600">By sales value with contribution percentage</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Top Products</h4>
                <p className="text-xs text-gray-600">By sales value and quantity sold</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Percent className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-gray-900">Contribution</h4>
                <p className="text-xs text-gray-600">Percentage of total period sales</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}