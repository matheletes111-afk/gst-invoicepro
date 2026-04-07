"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  User,
  Activity,
  LogIn,
  Edit,
  Filter,
  X,
  Eye,
  Json,
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
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function UserActivityLogReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalItems, setTotalItems] = useState(0);
  
  // NEW: Store all available modules and actions (not just from filtered data)
  const [allModules, setAllModules] = useState([]);
  const [allActions, setAllActions] = useState([]);
  
  // Fetch ALL available modules and actions (for dropdowns)
  const fetchAllModulesAndActions = async () => {
    try {
      // This endpoint should return all possible modules and actions, not just filtered ones
      const response = await fetch('/api/reports/user-activity-log/options');
      const data = await response.json();
      
      if (data.success) {
        setAllModules(data.modules || []);
        setAllActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching modules and actions:', error);
      // If the endpoint doesn't exist, extract from initial data later
    }
  };
  
  // Extract unique modules and actions from data (as fallback)
  const extractModulesAndActions = (data) => {
    const modules = new Set();
    const actions = new Set();
    
    data.forEach(activity => {
      if (activity.module) modules.add(activity.module);
      if (activity.action) actions.add(activity.action);
    });
    
    return {
      modules: Array.from(modules).sort(),
      actions: Array.from(actions).sort()
    };
  };
  
  // Fetch report data with pagination
  const fetchReportData = async (resetFilters = false, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      let fromDateValue = fromDate;
      let toDateValue = toDate;
      let searchQueryValue = searchQuery;
      let actionFilterValue = actionFilter;
      let moduleFilterValue = moduleFilter;
      
      // If resetting, use empty values
      if (resetFilters) {
        fromDateValue = '';
        toDateValue = '';
        searchQueryValue = '';
        actionFilterValue = 'ALL';
        moduleFilterValue = 'ALL';
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
      if (actionFilterValue !== 'ALL') {
        params.append('action', actionFilterValue);
      }
      if (moduleFilterValue !== 'ALL') {
        params.append('module', moduleFilterValue);
      }
      
      // Add pagination parameters
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      const response = await fetch(`/api/reports/user-activity-log?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary || {
          total_activities: 0,
          unique_users: 0,
          logins: 0,
          updates: 0,
          creates: 0,
          deletes: 0
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
        if (actionFilterValue !== 'ALL') filters.push(`Action: ${actionFilterValue}`);
        if (moduleFilterValue !== 'ALL') filters.push(`Module: ${moduleFilterValue}`);
        setActiveFilters(filters);
        
        // If we don't have allModules/allActions yet, extract from initial unfiltered data
        if (isInitialLoad && data.allModules && data.allActions) {
          setAllModules(data.allModules);
          setAllActions(data.allActions);
        } else if (isInitialLoad && data.data.length > 0) {
          // Fallback: extract from first data load
          const { modules, actions } = extractModulesAndActions(data.data);
          setAllModules(modules);
          setAllActions(actions);
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setSummary({
        total_activities: 0,
        unique_users: 0,
        logins: 0,
        updates: 0,
        creates: 0,
        deletes: 0
      });
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };
  
  // View activity details
  const viewActivityDetails = (activity) => {
    setSelectedActivity(activity);
    setIsDialogOpen(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedActivity(null);
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
      if (actionFilter !== 'ALL') {
        params.append('action', actionFilter);
      }
      if (moduleFilter !== 'ALL') {
        params.append('module', moduleFilter);
      }
      params.append('export', 'csv');
      
      const response = await fetch(`/api/reports/user-activity-log?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
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
      if (actionFilter !== 'ALL') {
        params.append('action', actionFilter);
      }
      if (moduleFilter !== 'ALL') {
        params.append('module', moduleFilter);
      }
      params.append('export', 'pdf');
      
      const response = await fetch(`/api/reports/user-activity-log?${params}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-activity-log-${new Date().toISOString().split('T')[0]}.pdf`;
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
    setActionFilter('ALL');
    setModuleFilter('ALL');
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
    } else if (filterToRemove.startsWith('Action:')) {
      setActionFilter('ALL');
    } else if (filterToRemove.startsWith('Module:')) {
      setModuleFilter('ALL');
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
  
  // Initial fetch
  useEffect(() => {
    // First, fetch all available modules and actions for dropdowns
    fetchAllModulesAndActions();
    // Then fetch the report data
    fetchReportData();
  }, []);
  
  // Effect to refetch when items per page changes
  useEffect(() => {
    if (!isInitialLoad) {
      fetchReportData(false, 1);
    }
  }, [itemsPerPage]);
  
  // Get action color based on your data
  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
      case 'DELETED':
        return 'error';
      case 'LOGIN':
        return 'success';
      case 'VIEW':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // Get module color for Tailwind
  const getModuleTailwindColor = (module) => {
    const colors = {
      'sales': 'bg-blue-100 text-blue-800',
      'purchase': 'bg-green-100 text-green-800',
      'secondhand-sales': 'bg-purple-100 text-purple-800',
      'secondhand-purchase': 'bg-orange-100 text-orange-800',
      'adjustment': 'bg-yellow-100 text-yellow-800',
      'party': 'bg-indigo-100 text-indigo-800',
      'unit': 'bg-pink-100 text-pink-800',
      'goods-catalog': 'bg-teal-100 text-teal-800',
      'service-catalog': 'bg-rose-100 text-rose-800',
      'auth': 'bg-red-100 text-red-800',
      'dzongkhag': 'bg-gray-100 text-gray-800'
    };
    
    const lowerModule = module?.toLowerCase();
    return colors[lowerModule] || 'bg-gray-100 text-gray-800';
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
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format module name (convert kebab-case to Title Case)
  const formatModuleName = (module) => {
    if (!module) return 'Unknown';
    return module
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Use allModules and allActions for dropdowns (not just filtered data)
  const modules = allModules.length > 0 ? allModules : [];
  const actions = allActions.length > 0 ? allActions : [];
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
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
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Activity Log</h1>
            <p className="text-gray-600">Track and audit all user activities across the system</p>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.total_activities || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.unique_users || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Login Activities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.logins || 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <LogIn className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Changes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(summary?.creates || 0) + (summary?.updates || 0) + (summary?.deletes || 0)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Edit className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilters.length > 0 && (
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
          )}
          
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by user name, email, description, IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Actions</option>
                  {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Modules</option>
                  {modules.map(module => (
                    <option key={module} value={module}>{formatModuleName(module)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <p>Audit trail of all user activities for security and compliance</p>
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
                
                {/* <button
                  onClick={exportToPDF}
                  disabled={exporting || loading || reportData.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </button> */}
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
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
                        <p className="mt-2 text-gray-500">Loading activity log...</p>
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No activity logs found
                        {activeFilters.length > 0 && (
                          <p className="mt-2 text-sm">Try adjusting your filters</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    reportData.map((activity, index) => (
                      <tr key={activity.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(activity.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold">
                                {activity.userName?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {activity.userName || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {activity.userEmail || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getModuleTailwindColor(activity.module)}`}>
                            {activity.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${getModuleTailwindColor(activity.module)}`}>
                            {formatModuleName(activity.module)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900">
                              {/* {activity.description || 'No description'} */}
                               {formatModuleName(activity.module)} {activity.action}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {activity.ipAddress || '-'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {activity.userAgent?.substring(0, 50) || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => viewActivityDetails(activity)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            View
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
                Total: {totalItems} activities
              </div>
            </div>
          )}
          
          {/* Footer Info */}
          {!loading && reportData.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} activities • 
                Page {currentPage} of {totalPages} • 
                Users: {summary?.unique_users || 0} • 
                Logins: {summary?.logins || 0} • 
                Changes: {(summary?.creates || 0) + (summary?.updates || 0) + (summary?.deletes || 0)}
              </p>
              <p className="font-medium">Export will include all fields shown in the table above</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Activity Details
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
          {selectedActivity && (
            <Box sx={{ mt: 2 }}>
              {/* Basic Information */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedActivity.userName || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedActivity.userEmail || 'No email'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      User ID: {selectedActivity.userId || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Timestamp
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {formatDateTime(selectedActivity.createdAt)}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Action
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Chip 
                      label={selectedActivity.action} 
                      color={getActionColor(selectedActivity.action)}
                      size="small"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Module
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Chip 
                      label={formatModuleName(selectedActivity.module)} 
                      variant="outlined"
                      size="small"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedActivity.description || 'No description'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    IP Address
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedActivity.ipAddress || '-'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User Agent
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {selectedActivity.userAgent || '-'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payload Data
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.900', 
                      color: 'grey.100',
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {selectedActivity.payload 
                        ? JSON.stringify(selectedActivity.payload, null, 2)
                        : 'No payload data'}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
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