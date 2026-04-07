"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  User,
  Activity,
  Edit,
  Filter,
  X,
  Eye,
  Database,
  Plus,
  RefreshCw,
  History,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

// Material-UI Components
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  Grid,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function DataChangeLogReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordHistory, setRecordHistory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [masterDataTypeFilter, setMasterDataTypeFilter] = useState('ALL');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Store all available modules
  const [allModules, setAllModules] = useState([]);
  
  // Fetch ALL available modules (for dropdowns)
  const fetchAllOptions = async () => {
    try {
      const response = await fetch('/api/reports/master-data-change?options=true');
      const data = await response.json();
      
      if (data.success) {
        setAllModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };
  
  // Fetch report data with pagination
  const fetchReportData = async (resetFilters = false, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      let fromDateValue = fromDate;
      let toDateValue = toDate;
      let searchQueryValue = searchQuery;
      let masterDataTypeFilterValue = masterDataTypeFilter;
      
      // If resetting, use empty values
      if (resetFilters) {
        fromDateValue = '';
        toDateValue = '';
        searchQueryValue = '';
        masterDataTypeFilterValue = 'ALL';
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
      if (masterDataTypeFilterValue !== 'ALL') {
        params.append('master_data_type', masterDataTypeFilterValue);
      }
      
      // Add pagination parameters
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      const response = await fetch(`/api/reports/master-data-change?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary || {
          total_creates: 0,
          unique_master_types: 0,
          total_updates: 0,
          unique_users: 0,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: itemsPerPage,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
        
        // Update pagination info
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        }
        
        // Update active filters
        const filters = [];
        if (fromDateValue) filters.push(`From: ${fromDateValue}`);
        if (toDateValue) filters.push(`To: ${toDateValue}`);
        if (searchQueryValue) filters.push(`Search: "${searchQueryValue}"`);
        if (masterDataTypeFilterValue !== 'ALL') filters.push(`Type: ${formatMasterDataType(masterDataTypeFilterValue)}`);
        setActiveFilters(filters);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setSummary({
        total_creates: 0,
        unique_master_types: 0,
        total_updates: 0,
        unique_users: 0,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: itemsPerPage,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };
  
  // Fetch record history
  const fetchRecordHistory = async (record) => {
    setLoadingHistory(true);
    setSelectedRecord(record);
    
    try {
      const params = new URLSearchParams();
      params.append('record_history', 'true');
      params.append('record_id', record.recordId);
      params.append('master_data_type', record.module);
      
      const response = await fetch(`/api/reports/master-data-change?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRecordHistory(data);
        setIsDialogOpen(true);
        setActiveTab(0);
      }
    } catch (error) {
      console.error('Error fetching record history:', error);
      alert('Error loading record history');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRecord(null);
    setRecordHistory(null);
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
      if (masterDataTypeFilter !== 'ALL') {
        params.append('master_data_type', masterDataTypeFilter);
      }
      params.append('export', 'csv');
      
      const response = await fetch(`/api/reports/master-data-change?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-create-log-${new Date().toISOString().split('T')[0]}.csv`;
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
    fetchReportData(false, 1);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setMasterDataTypeFilter('ALL');
    setActiveFilters([]);
    setCurrentPage(1);
    fetchReportData(true, 1);
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
      setMasterDataTypeFilter('ALL');
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    handleResetFilters();
  };
  
  // Pagination handlers
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchReportData(false, page);
  };
  
  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  
  // Initial fetch
  useEffect(() => {
    // First, fetch all available options for dropdowns
    fetchAllOptions();
    // Then fetch the report data
    fetchReportData();
  }, []);
  
  // Effect to refetch when items per page changes
  useEffect(() => {
    if (!isInitialLoad) {
      fetchReportData(false, 1);
    }
  }, [itemsPerPage]);
  
  // Format master data type name
  const formatMasterDataType = (module) => {
    const moduleMap = {
      'unit': 'Unit',
      'dzongkhag': 'Dzongkhag',
      'gewog': 'Gewog',
      'village': 'Village',
      'gst-rate-slabs-api': 'GST Slab',
      'gst-rate': 'GST Rate',
      'map-gst-rates': 'GST Mapping',
      'currency': 'Currency',
      'exchange-rate': 'Exchange Rate',
      'service-catalog': 'Service',
      'goods-catalog': 'Goods',
      'supplier': 'Supplier',
      'dealer': 'Dealer'
    };
    
    return moduleMap[module] || module.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  // Get master data type color
  const getMasterDataTypeColor = (type) => {
    const colors = {
      'Unit': 'bg-purple-100 text-purple-800',
      'Dzongkhag': 'bg-indigo-100 text-indigo-800',
      'Gewog': 'bg-blue-100 text-blue-800',
      'Village': 'bg-cyan-100 text-cyan-800',
      'GST Slab': 'bg-teal-100 text-teal-800',
      'GST Rate': 'bg-emerald-100 text-emerald-800',
      'GST Mapping': 'bg-green-100 text-green-800',
      'Currency': 'bg-lime-100 text-lime-800',
      'Exchange Rate': 'bg-yellow-100 text-yellow-800',
      'Service': 'bg-amber-100 text-amber-800',
      'Goods': 'bg-orange-100 text-orange-800',
      'Supplier': 'bg-red-100 text-red-800',
      'Dealer': 'bg-pink-100 text-pink-800'
    };
    
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  
  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Safe string conversion for truncation
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  // Truncate long text safely
  const truncateText = (text, maxLength = 50) => {
    const str = safeToString(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };
  
  // Parse payload safely
  const parsePayload = (payload) => {
    if (!payload) return {};
    
    try {
      if (typeof payload === 'string') {
        try {
          return JSON.parse(payload);
        } catch {
          try {
            return JSON.parse(JSON.parse(payload));
          } catch {
            return {};
          }
        }
      }
      return payload;
    } catch (error) {
      console.error('Error parsing payload:', error);
      return {};
    }
  };
  
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
        endPage = totalPages - 1;
      }
      
      pages.push(1);
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  // Use allModules for dropdowns
  const modules = allModules.length > 0 ? allModules : [];
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-full animate-pulse">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
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
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Master Data Creation Log</h1>
            <p className="text-gray-600">Track all master data creation records and their update history</p>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Creates</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.total_creates || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <Plus className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Master Types</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.unique_master_types || 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Updates</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.total_updates || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary?.unique_users || 0}
                  </p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {/* {activeFilters.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200 text-sm"
                  >
                    <span className="text-blue-700">{filter}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )} */}
          
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
              {/* <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by record name, field values, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div> */}
              
              <div>
                <select
                  value={masterDataTypeFilter}
                  onChange={(e) => setMasterDataTypeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Master Data Types</option>
                  {modules.map(module => (
                    <option key={module} value={module}>{formatMasterDataType(module)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <p>View creation records and compare with update history</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  disabled={exporting || loading || reportData.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : `Export CSV (${totalItems})`}
                </button>
              </div>
            </div>
          </div>
          
      
          
          {/* Report Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Master Data Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Values
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-2 text-gray-500">Loading creation log...</p>
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Database className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No creation records found</p>
                          {activeFilters.length > 0 && (
                            <p className="mt-2 text-sm">Try adjusting your filters</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reportData.map((record, index) => (
                      <tr key={record.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(record.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${getMasterDataTypeColor(record.masterDataType)}`}>
                            {record.masterDataType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {truncateText(record.recordName, 30)}
                          </div>
                          {record.recordId && (
                            <div className="text-xs text-gray-500">
                              ID: {record.recordId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {record.displayValues && record.displayValues.length > 0 ? (
                              record.displayValues.map((value, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  {truncateText(value, 40)}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400">No key values</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 text-blue-500 mr-1" />
                            <span className={`text-sm font-medium ${record.updateCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                              {record.updateCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                              <span className="text-green-600 text-xs font-semibold">
                                {record.changedBy?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.changedBy}
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.changedByEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => fetchRecordHistory(record)}
                            disabled={loadingHistory}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingHistory && selectedRecord?.id === record.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <History className="h-4 w-4" />
                                Compare
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Controls */}
              {/* Items Per Page Selector */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
             <div className="text-sm text-gray-600">
             <span className="text-sm text-gray-700">Show</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
            </div>
            
            {totalItems > 0 && (
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>
            )}
          </div>
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-1">
                {/* First Page Button */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                
                {/* Previous Page Button */}
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {generatePageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() => typeof pageNum === 'number' ? goToPage(pageNum) : null}
                      className={`px-3 py-1 rounded-lg border ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : typeof pageNum === 'number'
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-transparent text-gray-400 cursor-default'
                      }`}
                      disabled={typeof pageNum !== 'number'}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                {/* Next Page Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {/* Last Page Button */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Total: {totalItems} records
              </div>
            </div>
          )}
          
          {/* Footer Info */}
          {!loading && reportData.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} creation records • 
                Page {currentPage} of {totalPages} • 
                Master Types: {summary?.unique_master_types || 0} • 
                Total Updates: {summary?.total_updates || 0}
              </p>
              <p className="font-medium">Click "Compare" to view creation and update history for each record</p>
            </div>
          )}
        </div>
      </div>

      {/* Record History Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Record History - {selectedRecord?.recordName || 'Unknown'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent dividers>
          {selectedRecord && recordHistory && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Creation Details" />
                <Tab label="Update History" />
                <Tab label="Full Timeline" />
              </Tabs>
              
              <Box sx={{ mt: 3 }}>
                {activeTab === 0 && recordHistory.createActivity && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Initial Creation Values
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" fontWeight="medium">
                              Created At:
                            </Typography>
                            <Typography variant="body2">
                              {formatDateTime(recordHistory.createActivity.timestamp)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" fontWeight="medium">
                              Created By:
                            </Typography>
                            <Typography variant="body2">
                              {recordHistory.createActivity.changedBy}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              Initial Values:
                            </Typography>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                bgcolor: 'grey.50',
                                maxHeight: 300,
                                overflow: 'auto'
                              }}
                            >
                              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                                {JSON.stringify(parsePayload(recordHistory.createActivity.payload), null, 2)}
                              </pre>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
                
                {activeTab === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Update History ({recordHistory.updateActivities?.length || 0} updates)
                      </Typography>
                      
                      {recordHistory.updateActivities && recordHistory.updateActivities.length > 0 ? (
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                          {recordHistory.updateActivities.map((update, index) => (
                            <Paper 
                              key={update.id}
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                mb: 2,
                                bgcolor: 'info.50'
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Update #{index + 1}:
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatDateTime(update.timestamp)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Updated By:
                                  </Typography>
                                  <Typography variant="body2">
                                    {update.changedBy}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Description:
                                  </Typography>
                                  <Typography variant="body2">
                                    {update.description || 'No description'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    Updated Values:
                                  </Typography>
                                  <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                      p: 1, 
                                      bgcolor: 'white',
                                      maxHeight: 200,
                                      overflow: 'auto'
                                    }}
                                  >
                                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                                      {JSON.stringify(parsePayload(update.payload), null, 2)}
                                    </pre>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </Box>
                      ) : (
                        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No update history found for this record
                          </Typography>
                        </Paper>
                      )}
                    </Grid>
                  </Grid>
                )}
                
                {activeTab === 2 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Complete Timeline
                      </Typography>
                      
                      <Stepper orientation="vertical">
                        {recordHistory.allActivities && recordHistory.allActivities.map((activity, index) => (
                          <Step key={activity.id} active>
                            <StepLabel>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={activity.action}
                                  color={
                                    activity.action === 'CREATE' ? 'success' :
                                    activity.action === 'UPDATE' ? 'info' :
                                    'error'
                                  }
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {formatDateTime(activity.timestamp)}
                                </Typography>
                              </Box>
                            </StepLabel>
                            <StepContent>
                              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" fontWeight="medium">
                                      User:
                                    </Typography>
                                    <Typography variant="body2">
                                      {activity.changedBy}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" fontWeight="medium">
                                      Description:
                                    </Typography>
                                    <Typography variant="body2">
                                      {activity.description || 'No description'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="body2" fontWeight="medium">
                                      Payload:
                                    </Typography>
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ 
                                        p: 1, 
                                        bgcolor: 'grey.50',
                                        mt: 0.5,
                                        maxHeight: 150,
                                        overflow: 'auto'
                                      }}
                                    >
                                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                                        {JSON.stringify(parsePayload(activity.payload), null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </StepContent>
                          </Step>
                        ))}
                      </Stepper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}