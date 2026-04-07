// app/gst-statement/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, Receipt, CheckSquare, Square, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function GSTStatementPage() {
  const router = useRouter();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState("light");
  const [organizationId, setOrganizationId] = useState('');
  
  // Date filters
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(localStorage.getItem("materio-mui-template-mode") || "light");
      
      // Get organization ID on component mount
      const fetchOrganizationId = async () => {
        try {
          let orgId = '';
          const orgData = localStorage.getItem('organization');
          if (orgData) {
            const org = JSON.parse(orgData);
            orgId = org.id || '';
          }

          if (!orgId) {
            const orgResponse = await fetch('/api/auth/organization', {
              credentials: 'include'
            });
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              orgId = orgData.organizationId;
              // Store in localStorage for future use
              localStorage.setItem('organization', JSON.stringify({ id: orgId }));
            }
          }

          if (orgId) {
            setOrganizationId(orgId);
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      };
      
      fetchOrganizationId();
    }
  }, []);

const fetchSales = async () => {
  if (!fromDate || !toDate) {
    toast.error("Please select both from and to dates");
    return;
  }

  if (!organizationId) {
    toast.error("Unable to determine organization. Please login again.");
    return;
  }

  setLoading(true);
  try {
    const params = new URLSearchParams({
      start_date: fromDate,
      end_date: toDate,
      page: "1",
      limit: "500",
      organization_id: organizationId, // Pass the actual organizationId
    });
    
    console.log('Fetching sales with params:', params.toString());
    
    const res = await fetch(`/api/sales/list?${params}`, {
      credentials: 'include'
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch sales: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Sales API response:', data);

    if (data.success) {
      const salesWithSelection = data.data.map((sale) => ({
        ...sale,
        selected: true,
        taxable_amount: parseFloat(sale.taxable_amount) || 0,
        exempt_amount: parseFloat(sale.exempt_amount) || 0,
        gst_amount: parseFloat(sale.gst_amount) || 0,
        total_invoice_amount: parseFloat(sale.total_invoice_amount) || 0,
      }));
      setSales(salesWithSelection);
      setSelectAll(true);
      toast.success(`Found ${data.data.length} sales records`);
    } else {
      toast.error(data.message || "Failed to fetch sales data");
      setSales([]);
      setSelectAll(false);
    }
  } catch (err) {
    console.error("Error fetching sales:", err);
    toast.error(err.message || "Failed to load sales data");
    setSales([]);
    setSelectAll(false);
  } finally {
    setLoading(false);
  }
};

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSales(sales.map(sale => ({
      ...sale,
      selected: newSelectAll
    })));
  };

  const handleSelectSale = (salesId) => {
    setSales(sales.map(sale => 
      sale.sales_id === salesId 
        ? { ...sale, selected: !sale.selected }
        : sale
    ));
    
    const allSelected = sales.every(sale => 
      sale.sales_id === salesId ? !sale.selected : sale.selected
    );
    setSelectAll(allSelected);
  };

const handleGenerateStatement = async () => {
  const selected = sales.filter(sale => sale.selected);
  
  if (selected.length === 0) {
    toast.error("Please select at least one sale");
    return;
  }

  if (!organizationId) {
    toast.error("Unable to determine organization. Please login again.");
    return;
  }

  setGenerating(true);
  try {
    // Format sales IDs as hyphen-separated string: 2-5-6
    const salesIdsString = selected.map(s => s.sales_id).join('-');
    
    // Store all data in localStorage
    const gstData = {
      salesIds: salesIdsString,
      fromDate: fromDate,
      toDate: toDate,
      organizationId: organizationId,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('gstStatementData', JSON.stringify(gstData));
    
    console.log('Stored in localStorage:', gstData);
    
    // Build the URL - no need to pass parameters since we'll use GET method
    const url = `/api/sales/gst-statement`;
    
    console.log('Generated URL:', url);
    
    // Open in new tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.location.href = url;
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
    
    toast.success(`GST Statement generated for ${selected.length} invoices`);
  } catch (err) {
    console.error("Error generating statement:", err);
    toast.error("Failed to generate GST statement");
  } finally {
    setGenerating(false);
  }
};


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateTotals = () => {
    return sales.reduce((acc, sale) => {
      if (sale.selected) {
        acc.taxable += parseFloat(sale.taxable_amount) || 0;
        acc.exempt += parseFloat(sale.exempt_amount) || 0;
        acc.gst += parseFloat(sale.gst_amount) || 0;
        acc.total += parseFloat(sale.total_invoice_amount) || 0;
      }
      return acc;
    }, { taxable: 0, exempt: 0, gst: 0, total: 0 });
  };

  const totals = calculateTotals();
  const selectedCount = sales.filter(s => s.selected).length;

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              GST Statement
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Generate GST statement for selected sales invoices
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Debug info - remove in production */}
            {organizationId && (
              <div className={`text-sm px-3 py-1 rounded ${
                theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"
              }`}>
                Org ID: {organizationId.substring(0, 8)}...
              </div>
            )}
            
            {/* Generate Button */}
            <button
              onClick={handleGenerateStatement}
              disabled={loading || generating || sales.length === 0 || selectedCount === 0 || !organizationId}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
                generating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {generating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate Statement
                </>
              )}
            </button>
          </div>
        </div>

        {/* Date Filters Card */}
        <div className={`rounded-xl shadow-sm p-6 mb-6 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-700"}`}>
              <Calendar className="w-5 h-5 inline-block mr-2" />
              Select Date Range
            </h2>
            {!organizationId && (
              <div className={`text-sm px-3 py-1 rounded ${
                theme === "dark" ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
              }`}>
                Waiting for organization ID...
              </div>
            )}
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            fetchSales();
          }} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === "dark" 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === "dark" 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !organizationId}
                className={`px-6 py-3 rounded-lg flex items-center ${
                  loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Fetch Sales
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Selection Summary */}
        {sales.length > 0 && (
          <div className={`rounded-lg p-4 mb-4 ${
            theme === "dark" ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className={`p-2 rounded-lg ${
                      theme === "dark" 
                        ? "hover:bg-blue-800/30" 
                        : "hover:bg-blue-100"
                    }`}
                    title={selectAll ? "Unselect All" : "Select All"}
                  >
                    {selectAll ? (
                      <CheckSquare className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <span className={`font-medium ${
                    theme === "dark" ? "text-blue-300" : "text-blue-700"
                  }`}>
                    {selectedCount} of {sales.length} invoices selected
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="text-sm">
                  <span className={theme === "dark" ? "text-blue-300" : "text-blue-600"}>
                    Selected Totals:
                  </span>
                  <span className={`ml-2 font-bold text-lg ${
                    theme === "dark" ? "text-white" : "text-blue-800"
                  }`}>
                    Nu. {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table */}
        {sales.length > 0 ? (
          <div className={`rounded-lg border shadow-sm overflow-hidden ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${
                    theme === "dark" ? "bg-gray-900 bg-opacity-40 border-gray-700" : "bg-gray-100"
                  }`}>
                    <th className="px-6 py-4 text-left font-semibold w-12">
                      #
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">Invoice No</th>
                    <th className="px-6 py-4 text-left font-semibold">Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Customer</th>
                    <th className="px-6 py-4 text-left font-semibold">TPN</th>
                    <th className="px-6 py-4 text-left font-semibold text-right">Taxable</th>
                    <th className="px-6 py-4 text-left font-semibold text-right">Exempt</th>
                    <th className="px-6 py-4 text-left font-semibold text-right">GST</th>
                    <th className="px-6 py-4 text-left font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => (
                    <tr 
                      key={sale.sales_id} 
                      className={`border-b hover:${theme === "dark" ? "bg-gray-750" : "bg-gray-50"} transition-colors ${
                        sale.selected ? (theme === "dark" ? "bg-blue-900/10" : "bg-blue-50") : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 w-4">{index + 1}</span>
                          <button
                            onClick={() => handleSelectSale(sale.sales_id)}
                            className={`p-1.5 rounded ${
                              theme === "dark" 
                                ? "hover:bg-gray-700" 
                                : "hover:bg-gray-100"
                            }`}
                            title={sale.selected ? "Unselect" : "Select"}
                          >
                            {sale.selected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {sale.sales_invoice_no}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(sale.sales_date)}
                      </td>
                      <td className="px-6 py-4">
                        {sale.customer_name}
                      </td>
                      <td className="px-6 py-4">
                        {sale.customer_tpn || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        Nu. {parseFloat(sale.taxable_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        Nu. {parseFloat(sale.exempt_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        Nu. {parseFloat(sale.gst_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        Nu. {parseFloat(sale.total_invoice_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg border-2 border-dashed p-12 text-center ${
            theme === "dark" 
              ? "border-gray-700 bg-gray-800" 
              : "border-gray-300 bg-white"
          }`}>
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-700"
            }`}>
              No Sales Found
            </h3>
            <p className={`mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {organizationId 
                ? "Select a date range and click 'Fetch Sales' to view sales invoices" 
                : "Loading organization information..."}
            </p>
            <button
              onClick={fetchSales}
              disabled={loading || !organizationId}
              className={`px-6 py-3 rounded-lg flex items-center mx-auto ${
                loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Loading...
                </>
              ) : !organizationId ? (
                "Waiting for organization ID..."
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Fetch Sales
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}