"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  ArrowUpDown,
  Package,
  TrendingUp,
  Filter,
  X,
  BarChart3,
  DollarSign,
  Users,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function ItemWiseSalesSummaryReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('ALL');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'total_sales', direction: 'desc' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch report data with pagination
  const fetchReportData = async (resetFilters = false, page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      let fromDateValue = fromDate;
      let toDateValue = toDate;
      let searchQueryValue = searchQuery;
      let itemTypeValue = itemTypeFilter;
      
      // If resetting, use empty values
      if (resetFilters) {
        fromDateValue = '';
        toDateValue = '';
        searchQueryValue = '';
        itemTypeValue = 'ALL';
        setCurrentPage(1);
        page = 1;
      }
      
      if (fromDateValue) {
        params.append('from_date', fromDateValue);
      }
      if (toDateValue) {
        params.append('to_date', toDateValue);
      }
      if (searchQueryValue) {
        params.append('search', searchQueryValue);
      }
      if (itemTypeValue !== 'ALL') {
        params.append('item_type', itemTypeValue);
      }
      
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/reports/item-wise-sales-summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary || {
          total_items: 0,
          total_quantity: 0,
          total_sales: 0,
          total_tax: 0,
          avg_price: 0
        });
        
        // Set pagination info
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        } else {
          // Fallback if pagination not in response
          setTotalCount(data.data.length);
          setTotalPages(1);
        }
        
        // Update active filters
        const filters = [];
        if (fromDateValue) filters.push(`From: ${fromDateValue}`);
        if (toDateValue) filters.push(`To: ${toDateValue}`);
        if (searchQueryValue) filters.push(`Search: "${searchQueryValue}"`);
        if (itemTypeValue !== 'ALL') filters.push(`Type: ${itemTypeValue}`);
        setActiveFilters(filters);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setSummary({
        total_items: 0,
        total_quantity: 0,
        total_sales: 0,
        total_tax: 0,
        avg_price: 0
      });
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchReportData(false, newPage, itemsPerPage);
    }
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Effect to fetch data when itemsPerPage changes
  useEffect(() => {
    // Only fetch if not initial load
    if (!isInitialLoad) {
      fetchReportData(false, 1, itemsPerPage);
    }
  }, [itemsPerPage]);
  
  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    // Sort data
    const sortedData = [...reportData].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (typeof aValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });
    
    setReportData(sortedData);
  };
  
  // Export to CSV
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (fromDate) {
        params.append('from_date', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (itemTypeFilter !== 'ALL') {
        params.append('item_type', itemTypeFilter);
      }
      params.append('export', 'csv');
      
      const response = await fetch(`/api/reports/item-wise-sales-summary?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `item-wise-sales-summary-${new Date().toISOString().split('T')[0]}.csv`;
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
  
  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (fromDate) {
        params.append('from_date', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (itemTypeFilter !== 'ALL') {
        params.append('item_type', itemTypeFilter);
      }
      params.append('export', 'pdf');
      
      const response = await fetch(`/api/reports/item-wise-sales-summary?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `item-wise-sales-summary-${new Date().toISOString().split('T')[0]}.pdf`;
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
  
  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchReportData(false, 1, itemsPerPage);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setItemTypeFilter('ALL');
    setActiveFilters([]);
    // Fetch with reset flag to ignore state values
    fetchReportData(true, 1, itemsPerPage);
  };
  
  // Remove specific filter
  const removeFilter = (filterToRemove) => {
    if (filterToRemove.startsWith('From:')) {
      setFromDate('');
    } else if (filterToRemove.startsWith('To:')) {
      setToDate('');
    } else if (filterToRemove.startsWith('Search:')) {
      setSearchQuery('');
    } else if (filterToRemove.startsWith('Type:')) {
      setItemTypeFilter('ALL');
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    handleResetFilters();
  };
  
  // Initial fetch
  useEffect(() => {
    fetchReportData();
  }, []);
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };
  
  // Format number
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 text-blue-600 rotate-180" />
      : <ArrowUpDown className="h-4 w-4 text-blue-600" />;
  };
  
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  // Show loading skeleton
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-full animate-pulse">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 border-b border-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Item-Wise Sales Summary</h1>
          <p className="text-gray-600">Analyze sales performance by product or service</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.total_items || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quantity Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(summary?.total_quantity)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Hash className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.total_sales)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tax</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.total_tax)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.avg_price)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Applying...' : 'Apply Filters'}
              </button>
              
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by item code, description, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <select
                value={itemTypeFilter}
                onChange={(e) => setItemTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Item Types</option>
                <option value="GOODS">Goods</option>
                <option value="SERVICE">Services</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>Analyze product/service performance and customer segments</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                disabled={exporting || loading || totalCount === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : `Export CSV (${totalCount})`}
              </button>
              
              {/* <button
                onClick={exportToPDF}
                disabled={exporting || loading || totalCount === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button> */}
            </div>
          </div>
        </div>
        
        {/* Report Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Segment
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
                      <p className="mt-2 text-gray-500">Loading report data...</p>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No item sales data found
                      {activeFilters.length > 0 && (
                        <p className="mt-2 text-sm">Try adjusting your filters</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => (
                    <tr key={`${item.item_code || item.description}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.item_code || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900">
                            {item.description || 'No description'}
                          </div>
                          {item.unit && (
                            <div className="text-xs text-gray-500">Unit: {item.unit}</div>
                          )}
                        </div>
                      </td>
                    
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.item_type === 'GOODS' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.item_type === 'GOODS' ? 'Goods' : 'Service'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatNumber(item.quantity_sold)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.total_sales)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.tax_value)}
                        </div>
                        {item.tax_percentage && (
                          <div className="text-xs text-gray-500">
                            {item.tax_percentage}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {item.customer_segment || '-'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.customer_count ? `${item.customer_count} customers` : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {!loading && reportData.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleItemsPerPageChange(value);
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">items per page</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-1">
                {generatePageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} items
            </div>
          </div>
        )}
        
        {/* Footer Info */}
        {!loading && reportData.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            <p>Page {currentPage} of {totalPages} • 
              Showing {reportData.length} item{reportData.length !== 1 ? 's' : ''} • 
              Total Qty: {formatNumber(summary?.total_quantity)} • 
              Total Sales: {formatCurrency(summary?.total_sales)} • 
              Total Tax: {formatCurrency(summary?.total_tax)}
            </p>
            <p className="font-medium">Export will include all fields shown in the table above</p>
          </div>
        )}
      </div>
    </div>
  );
}