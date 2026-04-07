"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Receipt, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function List() {
  const router = useRouter();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionMenu, setActionMenu] = useState(null); // { id: second_hand_sales_id, top, left }

  const [theme, setTheme] = useState("light");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTheme(localStorage.getItem("materio-mui-template-mode") || "light");
    }
  }, []);

  // Fetch second hand sales
  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
        start_date: startDate,
        end_date: endDate,
      });

      const res = await fetch(`/api/secondhand-sales/list?${params}`);
      const data = await res.json();

      setSales(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [pagination.page, pagination.limit, statusFilter]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadSales();
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this second hand sale?")) return;

    try {
      const res = await fetch("/api/secondhand-sales/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ second_hand_sales_id: id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Second hand sale deleted");
        loadSales();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Error deleting sale");
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Second Hand Sales
            </h1>
            <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Manage second hand sales
            </p>
          </div>

          <Link
            href="/secondhand-goods-sales/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> New Sale
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Search</label>
                <input
                  type="text"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice, customer..."
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
              </div>

              <button className="px-5 py-3 bg-blue-600 text-white rounded-lg">
                Search
              </button>

            </div>
          </form>
        </div>

        {/* Table */}
        <div className={`table-list-card-shell rounded-lg border shadow-sm mt-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          {loading ? (
            <div className="h-64 flex justify-center items-center">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="h-64 flex justify-center items-center text-gray-500">
              No second hand sales found
            </div>
          ) : (
            <div className="table-list-scroll-x rounded-lg">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {["Invoice No", "Date", "Customer", "TPN", "Taxable", "Exempt", "GST", "Total", "Actions"].map(h => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.second_hand_sales_id} className="border-b">
                      <td className="px-6 py-4">{sale.sales_invoice_no}</td>
                      <td className="px-6 py-4">{new Date(sale.sales_date).toLocaleDateString("en-GB")}</td>
                      <td className="px-6 py-4">{sale.customer_name}</td>
                      <td className="px-6 py-4">{sale.customer_tpn}</td>
                      <td className="px-6 py-4">{Number(sale.taxable_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{Number(sale.exempt_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{Number(sale.gst_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{Number(sale.total_invoice_amount).toFixed(2)}</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 180;
                            setActionMenu((prev) =>
                              prev?.id === sale.second_hand_sales_id
                                ? null
                                : { id: sale.second_hand_sales_id, top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) }
                            );
                          }}
                          className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                          aria-label="Actions"
                          aria-expanded={actionMenu?.id === sale.second_hand_sales_id}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {actionMenu != null &&
          typeof document !== "undefined" &&
          (() => {
            const saleRow = sales.find((s) => s.second_hand_sales_id === actionMenu.id);
            if (!saleRow) return null;
            const dark = theme === "dark";
            return createPortal(
              <div
                className={`table-row-actions-dropdown ${dark ? "table-row-actions-dropdown--dark" : ""}`}
                style={{ top: actionMenu.top, left: actionMenu.left, minWidth: "11rem" }}
                onClick={(e) => e.stopPropagation()}
                role="menu"
              >
                <Link
                  href={`/secondhand-goods-sales/view/${saleRow.second_hand_sales_id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> View
                </Link>
                <Link
                  href={`/secondhand-goods-sales/edit/${saleRow.second_hand_sales_id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Edit
                </Link>
                <Link
                  href={`/api/secondhandgood-performa-invoice/${saleRow.second_hand_sales_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> View Performa Invoice
                </Link>
                <Link
                  href={`/api/secondhandgood-copy-invoice/${saleRow.second_hand_sales_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> View Invoice
                </Link>
                <Link
                  href={`/api/secondhandgood-tax-invoice/${saleRow.second_hand_sales_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                  onClick={() => setActionMenu(null)}
                  role="menuitem"
                >
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> View Tax Invoice
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setActionMenu(null);
                    handleDelete(saleRow.second_hand_sales_id);
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
