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
    }
  }, []);

const fetchSales = async () => {
  if (!fromDate || !toDate) {
    toast.error("Please select both from and to dates");
    return;
  }

  setLoading(true);
  try {
    const params = new URLSearchParams({
      start_date: fromDate,
      end_date: toDate,
      page: "1",
      limit: "500", // Increased limit to get more sales
      organization_id: "", // Make sure this is set properly
    });
    
    const res = await fetch(`/api/sales/list?${params}`);
    const data = await res.json();

    if (data.success) {
      const salesWithSelection = data.data.map((sale) => ({
        ...sale,
        selected: true,
        // Ensure all numeric fields are properly formatted
        taxable_amount: parseFloat(sale.taxable_amount) || 0,
        exempt_amount: parseFloat(sale.exempt_amount) || 0,
        gst_amount: parseFloat(sale.gst_amount) || 0,
        total_invoice_amount: parseFloat(sale.total_invoice_amount) || 0,
      }));
      setSales(salesWithSelection);
      setSelectAll(true);
      toast.success(`Found ${data.data.length} sales records`);
    } else {
      toast.error("Failed to fetch sales data");
      setSales([]);
      setSelectAll(false);
    }
  } catch (err) {
    console.error("Error fetching sales:", err);
    toast.error("Failed to load sales data");
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

// In your GST Statement page, update the handleGenerateStatement function:
const handleGenerateStatement = async () => {
  const selected = sales.filter(sale => sale.selected);
  
  if (selected.length === 0) {
    toast.error("Please select at least one sale");
    return;
  }

  // DEBUG: Log everything
  console.log('=== DEBUG GST Statement Generation ===');
  console.log('Selected sales count:', selected.length);
  console.log('Selected sales IDs:', selected.map(s => s.sales_id));
  console.log('Selected sales details:', selected.map(s => ({
    id: s.sales_id,
    invoice: s.sales_invoice_no,
    total: s.total_invoice_amount
  })));
  console.log('From Date:', fromDate);
  console.log('To Date:', toDate);

  setGenerating(true);
  try {
    const payload = {
      salesIds: selected.map(s => s.sales_id),
      fromDate: fromDate,
      toDate: toDate
    };

    console.log('Sending payload:', payload);

    // Send POST request with JSON body
    const response = await fetch('/api/sales/gst-statement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      let errorMessage = 'Failed to generate statement';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('Error response:', errorData);
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get the HTML content
    const html = await response.text();
    console.log('Received HTML length:', html.length);
    console.log('HTML first 500 chars:', html.substring(0, 500));
    
    // Open in new tab
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      console.log('Opened in new window');
    } else {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
    
    toast.success(`GST Statement generated for ${selected.length} invoices`);
  } catch (err) {
    console.error("Error generating statement:", err);
    toast.error(err.message || "Failed to generate GST statement");
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
            {/* Generate Button */}
            <button
              onClick={handleGenerateStatement}
              disabled={loading || generating || sales.length === 0 || selectedCount === 0}
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
                disabled={loading}
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
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-sm min-w-[800px]">
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
            {/* <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" /> */}
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-700"
            }`}>
              No Sales Found
            </h3>
            <p className={`mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              Select a date range and click "Fetch Sales" to view sales invoices
            </p>
            <button
              onClick={fetchSales}
              disabled={loading}
              className={`px-6 py-3 rounded-lg flex items-center mx-auto ${
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
        )}
      </div>
    </div>
  );
}