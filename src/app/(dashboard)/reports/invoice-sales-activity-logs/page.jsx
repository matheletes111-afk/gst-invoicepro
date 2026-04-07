"use client";

import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Calendar,
  Eye,
  FileText,
  History,
  TrendingUp,
  Filter,
  X,
  BarChart3,
  Users,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  User,
  FileEdit,
  Trash2,
  Plus,
  EyeOff,
  ArrowRight,
  GitCommit,
  GitCompare,
  RefreshCw,
  FilePlus,
  ArrowUpDown
} from 'lucide-react';

// Invoice Timeline Modal Component
const InvoiceTimelineModal = ({ salesId, onClose }) => {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      if (!salesId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/reports/invoice-sales-activity-logs?invoice_audit=true&sales_id=${salesId}`
        );
        const data = await response.json();

        if (data.success) {
          setAuditData(data);
        } else {
          console.error('Error fetching audit trail:', data.error);
        }
      } catch (error) {
        console.error('Error fetching audit trail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [salesId]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <FileEdit className="h-4 w-4 text-orange-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3 text-gray-600">Loading timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md">
          <div className="text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600 mb-6">No audit trail found for this invoice</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <History className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice Timeline & Audit Trail</h3>
                  <p className="text-sm text-gray-600">Complete history of changes for this invoice</p>
                </div>
              </div>

              {auditData.invoiceDetails && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{auditData.invoiceDetails.invoiceNo}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">{auditData.invoiceDetails.customerName}</div>
                    <div className="text-xs text-gray-500 mt-1">TPN: {auditData.invoiceDetails.customerTPN}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Amount</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(auditData.invoiceDetails.initialAmount)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {formatDate(auditData.invoiceDetails.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">By {auditData.invoiceDetails.createdBy}</div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors bg-white p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-600">Total Activities:</div>
                <div className="px-2 py-1 bg-gray-200 rounded text-sm font-bold">{auditData.summary.totalActions}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-600">Created:</div>
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-bold">{auditData.summary.createCount}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-600">Updates:</div>
                <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-bold">{auditData.summary.updateCount}</div>
              </div>
              {auditData.summary.deleteCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-600">Deleted:</div>
                  <div className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-bold">{auditData.summary.deleteCount}</div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Timeline: {auditData.summary.firstActivity ? formatDate(auditData.summary.firstActivity) : 'N/A'}
              <ArrowRight className="h-3 w-3 inline mx-1" />
              {auditData.summary.lastActivity ? formatDate(auditData.summary.lastActivity) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-6 text-lg flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-orange-500" />
              Activity Timeline
            </h4>
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-orange-300 to-orange-200"></div>

              {auditData.timeline.map((log, index) => (
                <div key={log.id} className="relative pl-20 pb-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-0 w-16 h-16 rounded-full flex items-center justify-center ${getActionColor(log.action)} shadow-lg`}>
                    {getActionIcon(log.action)}
                    <div className="absolute -bottom-6 text-xs font-medium">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-600 font-medium">by {log.performedBy}</span>
                        </div>
                        <p className="text-gray-700 mb-3">{log.description}</p>

                        {log.totalAmount > 0 && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Amount:</span>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(log.totalAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(log.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                    </div>

                    {log.action === 'UPDATE' && log.items && log.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <GitCompare className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Items Modified</span>
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                            {log.items.length} items
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {log.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="bg-orange-50 rounded-lg p-3">
                              <div className="font-medium text-sm text-gray-900">
                                {item.goods_service_name || 'Item'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Qty: {item.quantity} × {formatCurrency(item.unit_price || 0)}
                              </div>
                            </div>
                          ))}
                          {log.items.length > 4 && (
                            <div className="col-span-full text-center py-2 text-sm text-gray-500">
                              + {log.items.length - 4} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connecting arrow */}
                  {index < auditData.timeline.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-6 bg-gradient-to-b from-orange-300 to-orange-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Comparison Section */}
          {auditData.updateActions.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-6 text-lg flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-purple-500" />
                Data Changes Comparison
              </h4>

              {auditData.updateActions.map((update, index) => {
                const prevLog = index === 0 ? auditData.createAction : auditData.updateActions[index - 1];

                return (
                  <div key={update.id} className="mb-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg">
                            <RefreshCw className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <span className="font-bold text-white">Update #{index + 1}</span>
                            <div className="text-orange-100 text-sm">
                              {formatDate(update.timestamp)} • By {update.performedBy}
                            </div>
                          </div>
                        </div>
                        {prevLog?.totalAmount !== update.totalAmount && (
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                            <div className="text-sm font-bold text-white">
                              Amount: {formatCurrency(prevLog?.totalAmount || 0)}
                              <ArrowRight className="h-3 w-3 inline mx-2" />
                              {formatCurrency(update.totalAmount)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Before Update */}
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                          <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <h5 className="font-bold text-gray-700">Before Update</h5>
                            </div>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            {prevLog ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Timestamp</div>
                                    <div className="text-sm font-medium mt-1">{formatDate(prevLog.timestamp)}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Amount</div>
                                    <div className="text-lg font-bold text-gray-900 mt-1">
                                      {formatCurrency(prevLog.totalAmount)}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase font-medium">Performed By</div>
                                  <div className="text-sm font-medium mt-1 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {prevLog.performedBy}
                                  </div>
                                </div>
                                {prevLog.items && prevLog.items.length > 0 && (
                                  <div>
                                    <div className="text-xs text-gray-500 uppercase font-medium mb-2">
                                      Items ({prevLog.items.length})
                                    </div>
                                    <div className="space-y-2">
                                      {prevLog.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                          <div className="text-sm truncate">{item.goods_service_name}</div>
                                          <div className="text-sm font-medium">
                                            {item.quantity} × {formatCurrency(item.unit_price)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No previous data available</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* After Update */}
                        <div className="bg-white rounded-lg border border-green-300 overflow-hidden shadow-sm">
                          <div className="bg-green-50 px-4 py-3 border-b border-green-300">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <h5 className="font-bold text-green-800">After Update</h5>
                              <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Current Version
                              </div>
                            </div>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 uppercase font-medium">Timestamp</div>
                                  <div className="text-sm font-medium mt-1">{formatDate(update.timestamp)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 uppercase font-medium">Amount</div>
                                  <div className="text-lg font-bold text-green-600 mt-1">
                                    {formatCurrency(update.totalAmount)}
                                  </div>
                                  {prevLog && prevLog.totalAmount !== update.totalAmount && (
                                    <div className={`text-xs mt-1 font-medium ${update.totalAmount > prevLog.totalAmount ? 'text-red-600' : 'text-green-600'
                                      }`}>
                                      {update.totalAmount > prevLog.totalAmount ? '▲ Increased' : '▼ Decreased'} by
                                      <span className="font-bold ml-1">
                                        {formatCurrency(Math.abs(update.totalAmount - prevLog.totalAmount))}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium">Performed By</div>
                                <div className="text-sm font-medium mt-1 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {update.performedBy}
                                </div>
                              </div>
                              {update.items && update.items.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 uppercase font-medium mb-2">
                                    Items ({update.items.length})
                                  </div>
                                  <div className="space-y-2">
                                    {update.items.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between bg-green-50 p-2 rounded">
                                        <div className="text-sm truncate">{item.goods_service_name}</div>
                                        <div className="text-sm font-medium">
                                          {item.quantity} × {formatCurrency(item.unit_price)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FilePlus className="h-4 w-4 text-green-600" />
                <span>Created: {auditData.summary.createCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-orange-600" />
                <span>Updates: {auditData.summary.updateCount}</span>
              </div>
              {auditData.summary.deleteCount > 0 && (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>Deleted: {auditData.summary.deleteCount}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function InvoiceSalesActivityLogsReport() {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [selectedSalesId, setSelectedSalesId] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Fetch report data with pagination
  const fetchReportData = async (resetFilters = false, page = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      let fromDateValue = fromDate;
      let toDateValue = toDate;
      let searchQueryValue = searchQuery;

      // If resetting, use empty values
      if (resetFilters) {
        fromDateValue = '';
        toDateValue = '';
        searchQueryValue = '';
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

      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/reports/invoice-sales-activity-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
        setSummary(data.summary || {
          total_invoices: 0,
          unique_invoices: 0,
          total_updates: 0,
          average_updates: 0
        });

        // Set pagination info
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        } else {
          setTotalCount(data.data.length);
          setTotalPages(1);
        }
      } else {
        console.error('Error fetching report:', data.error);
        setReportData([]);
        setSummary({
          total_invoices: 0,
          unique_invoices: 0,
          total_updates: 0,
          average_updates: 0
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setReportData([]);
      setSummary({
        total_invoices: 0,
        unique_invoices: 0,
        total_updates: 0,
        average_updates: 0
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
      fetchReportData(false, newPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setTimeout(() => fetchReportData(false, 1), 100);
  };

  // Export to CSV
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();

      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (searchQuery) params.append('search', searchQuery);
      params.append('export', 'csv');

      const response = await fetch(`/api/reports/invoice-sales-activity-logs?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-creation-log-${new Date().toISOString().split('T')[0]}.csv`;
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

      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (searchQuery) params.append('search', searchQuery);
      params.append('export', 'pdf');

      const response = await fetch(`/api/reports/invoice-sales-activity-logs?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-creation-log-${new Date().toISOString().split('T')[0]}.pdf`;
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
    fetchReportData();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setCurrentPage(1);
    fetchReportData(true);
  };

  // Handle view timeline
  const handleViewTimeline = (salesId) => {
    setSelectedSalesId(salesId);
    setShowTimelineModal(true);
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Creation & Audit Report</h1>
              <p className="text-gray-600 mt-2">Track all invoice creation activities with update timelines and audit trails</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchReportData(false, currentPage)}
                disabled={loading}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices Created</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary?.total_invoices || 0}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <FilePlus className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Invoice Numbers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary?.unique_invoices || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Updates Made</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary?.total_updates || 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-full">
                <RefreshCw className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Updates/Invoice</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary?.average_updates || '0.0'}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Options</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="To Date"
                  />
                </div>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Invoices
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by invoice no, customer, user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 opacity-0">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyFilters}
                    disabled={loading}
                    className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Apply Filters
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <p>Showing invoice creation records with update tracking</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    disabled={exporting || loading || totalCount === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : `Export CSV (${totalCount})`}
                  </button>

                  {/* <button
                    onClick={exportToPDF}
                    disabled={exporting || loading || totalCount === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timestamp
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Invoice No.
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Performed By
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Customer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total Amount
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Update Count
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span className="text-gray-600">Loading invoice data...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No invoice creation records found</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {fromDate || toDate || searchQuery ? 'Try adjusting your filters' : 'No invoices have been created yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => (
                    <tr
                      key={`${item.id}-${index}`}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatDate(item.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {item.invoiceNo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {item.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.userEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.customerName}
                        </div>
                        {item.customerTPN && item.customerTPN !== 'N/A' && (
                          <div className="text-xs text-gray-500">
                            TPN: {item.customerTPN}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${item.updateCount > 0
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            <RefreshCw className={`h-3 w-3 ${item.updateCount > 0 ? 'animate-spin' : ''}`} />
                            {item.updateCount} update{item.updateCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewTimeline(item.salesId)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow flex items-center gap-2 group"
                        >
                          <Eye className="h-4 w-4" />
                          View Timeline
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
        {!loading && reportData.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow'
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
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="text-sm text-gray-700 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} invoices
            </div>
          </div>
        )}

        {/* Footer Info */}
        {!loading && reportData.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">
                  Page {currentPage} of {totalPages} •
                  Showing {reportData.length} invoice{reportData.length !== 1 ? 's' : ''} •
                  Total Updates: {summary?.total_updates} •
                  Avg Updates: {summary?.average_updates}/invoice
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-700">Export will include all fields shown in the table above</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      {showTimelineModal && (
        <InvoiceTimelineModal
          salesId={selectedSalesId}
          onClose={() => {
            setShowTimelineModal(false);
            setSelectedSalesId(null);
          }}
        />
      )}
    </div>
  );
}