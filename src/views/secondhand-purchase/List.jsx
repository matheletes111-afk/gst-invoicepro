"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Trash2, Eye, Package, Mail, Receipt, Send, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SecondHandPurchaseList() {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sending, setSending] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionMenu, setActionMenu] = useState(null); // { id: purchase_id, top, left }

  const [theme, setTheme] = useState("light");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(localStorage.getItem("materio-mui-template-mode") || "light");
    }
  }, []);

  // Fetch second hand purchases
  const loadPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetch(`/api/secondhand-purchase/list?${params}`);
      const data = await res.json();

      setPurchases(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load second hand purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    function handleClickOutside() { setActionMenu(null); }
    if (actionMenu != null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [actionMenu]);

  useEffect(() => {
    if (actionMenu == null) return;
    const close = () => setActionMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenu]);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadPurchases();
  };

  // Delete handler
  const handleDelete = async (purchaseId) => {
    if (!confirm("Are you sure you want to delete this second hand purchase? This will also delete all linked items.")) return;

    try {
      const res = await fetch("/api/secondhand-purchase/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_id: purchaseId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Second hand purchase deleted successfully");
        loadPurchases();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting second hand purchase");
    }
  };

  // View stock items
  const viewStockItems = (purchaseId) => {
    router.push(`/secondhand-stock?purchase_id=${purchaseId}`);
  };

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Second Hand Purchases</h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Manage your second hand goods purchases</p>
          </div>
          <Link href="/secondhand-goods-purchase/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center">
            <Plus className="w-5 h-5 mr-2" /> New Second Hand Purchase
          </Link>
        </div>

        {/* Filters */}
        <div className={`rounded-xl shadow-sm p-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              {/* Search */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search PO No, supplier, dealer..."
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300"
                      }`}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
                    />
                  </svg>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                    }`}
                />
              </div>

              {/* End Date */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                    }`}
                />
              </div>

              {/* Search Button */}
              <div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className={`table-list-card-shell rounded-lg border shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin h-8 w-8 border-2 border-b-transparent rounded-full border-blue-600"></div>
            </div>
          ) : purchases.length === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-500">No second hand purchases found</div>
          ) : (
            <>
            <div className="table-list-scroll-x rounded-t-lg">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className={`${theme === "dark" ? "bg-gray-900 bg-opacity-40" : "bg-gray-100"} border-b`}>
                    {["PO No", "Date", "Supplier", "Dealer", "Taxable", "Exempt", "GST", "Total", "Actions"].map((head) => (
                      <th key={head} className={`px-6 py-4 text-left font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-800"}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.purchase_id} className={`border-b hover:${theme === "dark" ? "bg-gray-750" : "bg-gray-50"} transition-colors`}>
                      <td className="px-6 py-4">{purchase.purchase_order_no}</td>
                      <td className="px-6 py-4">{new Date(purchase.purchase_date).toLocaleDateString("en-GB")}</td>
                      <td className="px-6 py-4">
                        {purchase.supplier?.supplierName || purchase.supplier_name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {purchase.dealer?.dealerName || purchase.dealer_name || "N/A"}
                      </td>
                      <td className="px-6 py-4">{parseFloat(purchase.taxable_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">{parseFloat(purchase.exempt_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">{parseFloat(purchase.gst_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">{parseFloat(purchase.total_invoice_amount || 0).toFixed(2)}</td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 160;
                            setActionMenu((prev) =>
                              prev?.id === purchase.purchase_id
                                ? null
                                : { id: purchase.purchase_id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                            );
                          }}
                          className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                          aria-label="Actions"
                          aria-expanded={actionMenu?.id === purchase.purchase_id}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

              {/* Pagination (same as your existing code) */}
              <div className={`px-6 py-4 flex justify-between items-center border-t rounded-b-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Showing <b className={theme === "dark" ? "text-white" : "text-gray-800"}>{(pagination.page - 1) * pagination.limit + 1}</b> –{" "}
                  <b className={theme === "dark" ? "text-white" : "text-gray-800"}>{Math.min(pagination.page * pagination.limit, pagination.total)}</b> of{" "}
                  <b className={theme === "dark" ? "text-white" : "text-gray-800"}>{pagination.total}</b>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className={`px-3 py-2 border rounded disabled:opacity-40 ${theme === "dark" ? "border-gray-600 text-gray-300" : "border-gray-300"}`}
                  >
                    ←
                  </button>
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                    else pageNum = pagination.page - 2 + i;
                    return (
                      <button
                        key={i}
                        className={`px-4 py-2 rounded ${pageNum === pagination.page
                          ? "bg-blue-600 text-white"
                          : theme === "dark"
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200"
                          }`}
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className={`px-3 py-2 border rounded disabled:opacity-40 ${theme === "dark" ? "border-gray-600 text-gray-300" : "border-gray-300"}`}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Rows per page */}
              <div className="mt-4 flex justify-end items-center gap-3 px-6 pb-4">
                <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Rows per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className={`px-3 py-2 border rounded ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </>
          )}
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const purchaseRow = purchases.find((p) => p.purchase_id === actionMenu.id);
            if (!purchaseRow) return null;
            const dark = theme === "dark";
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left }}
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/secondhand-goods-purchase/view/${purchaseRow.purchase_id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>
                <Link
                  href={`/secondhand-goods-purchase/edit/${purchaseRow.purchase_id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Edit
                </Link>
                <Link
                  href={`/api/secondhand-purchase/copy-invoice/${purchaseRow.purchase_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> View Invoice
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null);
                    handleDelete(purchaseRow.purchase_id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700 hover:text-red-400" : "text-gray-700 hover:bg-gray-100 hover:text-red-600"}`}
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> Delete
                </button>
              </div>,
              document.body
            );
          })()}
      </div>
    </div>
  );
}